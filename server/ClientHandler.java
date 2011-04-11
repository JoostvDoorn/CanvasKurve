package canvaskurve.server;

import java.io.*;
import java.net.Socket;
import java.util.concurrent.*;

/**
 * ClientHandler is de klasse die alle communicatie afhandelt met
 * de client. Verder gedraagt deze klasse zich ook als Speler, dus
 * deze klasse heeft ook een kleur en een naam. Kleur wordt bepaalt door
 * een ServerSpel en de naam wordt verkregen via het netwerk.
 * De methode run zorgt voor het ontvangen van berichten, in een los
 * Thread, wanneer aangeroepen via Thread.start()
 * Verder heeft deze klasse verschillende methode om Clients in te
 * lichten over de status van het spel.
 * @author Nick en Thomas
 */
public class ClientHandler extends NetwerkCommunicator {
	
	/**
	 * De Server waar deze ClientHandler onderdeel van is
	 * @invariant server != null
	 */
	private Server server;
	/**
	 * De naam van deze speler. Is null totdat de Client een geldige
	 * naam heeft opgegeven
	 * @invariant !server.isGeldigeNaam(naam) || naam == null
	 */
	private String naam;
	/**
	 * De Kleur die deze Speler gebruikt tijdens een ServerSpel
	 * dat nu loopt.
	 * @invariant if(kleur == null) then spel == null
	 */
	private Kleur kleur;
	/**
	 * Het spel waar deze Speler aan deelneemt. Moet opgeslagen worden
	 * om chatberichten naar te kunnen versturen
	 * @invariant if(spel == null) then kleur == null
	 */
	private ServerSpel spel;
	/**
	 * De versie van het protocol die Server en Client gemeen hebben
	 */
	private ProtocolVersie protocolVersie = ProtocolVersie.BASIS;
	/**
	 * @invariant volgendeZet.take() is afkomsting van Client of {-1, -1}
	 */
	private BlockingQueue<int[]> volgendeZet;
	/**
	 * true als deze speler aan de beurt is
	 * @invariant if(isAanDeBeurt) then isPlaying && !isJoining && naam != null
	 */
	private boolean isAanDeBeurt;
	/**
	 * true als deze speler 'join' heeft gestuurd
	 * maar nog niet deelneemt aan een spel
	 * @invariant if(isJoining) then !isPlaying && !isAanDeBeurt && kleur == null && naam != null
	 */
	private boolean isJoining;
	/**
	 * true als deze Speler met een spel bezig is
	 * @invariant if(isPlaying) then !isJoining && kleur != null && naam != null
	 */
	private boolean isPlaying;
	/**
	 * true als deze ClientHandler al uit de server verwijderd is
	 */
	private boolean isDisconnected;
	
	

	/**
     * De constructor maakt een nieuwe client handler aan.
	 * @param server De server waar deze cliënt onderdeel van is
	 * @param sock De socket met de verbinding naar de speler
	 * @throws IOException Als er iets mis is met de Socket
	 * @require server != null && sock != null
	 */
	public ClientHandler(Server server, Socket sock) throws IOException{
		this.server = server;
		this.sock = sock;
		in = new BufferedReader(
                new InputStreamReader(
                    this.sock.getInputStream()));
        out = new BufferedWriter(
        		new OutputStreamWriter(
        			this.sock.getOutputStream()));
        volgendeZet = new ArrayBlockingQueue<int[]>(1);
        isAanDeBeurt = false;
        isJoining = false;
        isPlaying = false;
        isDisconnected = false;
        kleur = null;
        naam = null;
        spel = null;
	}

	/**
	 * Handelt inkomende data af en verbreekt de verbinding
	 * op een nette manier.
	 */
	@Override
	public void run() {
		String message = "";
    	while(message != null) {
	        message = ontvangBericht();
	        if(message != null) {
	        	executeMessage(message);
	        }
    	}
    	boolean written = false;
    	while (!written) {
			try { // garandeert een ongeldige zet en dus het einde van een spel
				volgendeZet.put(new int[]{-1, -1});
				written = true;
			} catch (InterruptedException e1) {
			}
		}
    	if(!isDisconnected) {
    		disconnect();
    	}
	}

	/**
	 * Sluit de socket en de In/OutputStreams en verwijdert de speler uit de server.
	 */
	@Override
	public void disconnect() {
		try {
			sock.close();
			in.close();
			out.close();
		} catch (IOException e) {
			System.out.println("Kon de verbinding met " + naam + " niet op de juiste manier verbreken");
		}
		boolean written = volgendeZet.peek() != null;
        while (!written) {
            try {
                volgendeZet.put(new int[] { -1, -1 });
                written = true;
            } catch (InterruptedException e1) {
            }
        }
		server.disconnectClient(this);
		isDisconnected = true;
	}

	@Override
	public int[] bepaalZet(Bord b) {
		boolean heeftGelezen = false;
		int[] zet = null;
		while(!heeftGelezen) {
			try {
				zet = volgendeZet.take();
				heeftGelezen = true;
			} catch(InterruptedException e) {}
		}
		isAanDeBeurt = false;
		return zet;
	}

	public String getNaam() {
		return naam;
	}

	public Kleur getKleur() {
		return kleur;
	}
	
	public String getIpEnPoort() {
		return sock.getInetAddress().toString() + ":" + sock.getPort();
	}
	
	/**
	 * Geeft deze speler een kleur
	 * @param k De kleur die deze speler gebruikt in dit spel
	 * @param spel Via spel kunnen chatberichten gestuurd worden.
	 * @ensure k == getKleur()
	 */
	public void setKleur(ServerSpel s, Kleur k) {
		this.kleur = k;
		this.spel = s;
	}
	
	/**
	 * Stuur de Client een join_ack commando
	 */
	public void stuurJoinAck() {
		stuurBericht(Commando.SERVER_JOINACK.toString());
	}

	/**
	 * Stuurt een chatbericht naar deze Client, met de megegeven naam
	 * als verzender. Als deze Client geen chat ondersteund gebeurt er
	 * niks.
	 * @param naam De naar van de verzender
	 * @param bericht Het chatbericht
	 */
	public void stuurChat(String naam, String bericht) {
		if(protocolVersie == ProtocolVersie.CHAT || protocolVersie == ProtocolVersie.VOLLEDIG) {
			stuurBericht(Commando.SERVER_CHAT + " " + naam + " " + bericht);
		}
	}

	/**
	 * Stuurt het commando 'start' naar de client samen
	 * met de meegegeven spelers
	 * @param spelers Alle spelers die meedoen aan het spel,
	 * 		gescheiden door spaties
	 */
	public void stuurStart(String spelers) {
		isJoining = false;
		isPlaying = true;
		stuurBericht(Commando.SERVER_START + " " + spelers);
	}
	
	/**
	 * Stuur het commando 'turn' naar de client
	 */
	public void stuurTurn(boolean isAanDeBeurt) {
		this.isAanDeBeurt = isAanDeBeurt;
		stuurBericht(Commando.SERVER_TURN.toString());
	}
	
	/**
	 * Stuur het commando 'move' samen met de gegeven
	 * zet naar de client
	 * @param zet De zet die verstuurd moet worden
	 */
	public void stuurMove(int[] zet) {
		stuurBericht(Commando.SERVER_MOVE + " " + zet[Bord.X] + " " + zet[Bord.Y]);
	}

	/**
	 * Stuurt het commando 'end' naar de client
	 * @param winnaars De winnaar(s) van het spel
	 * @require winaars != null && winnaars != ""
	 */
	public void stuurEnd(String winnaars) {
		isPlaying = false;
		isJoining = false;
		stuurBericht(Commando.SERVER_END + " " + winnaars);
	}
	
	/**
	 * Stuurt het commando 'stop' samen met de naam
	 * van de client die zich niet goed gedraagt
	 * @param cheater De client die zich misdraagt
	 * @require cheater != null & cheater != ""
	 */
	public void stuurStop(String cheater) {
		isPlaying = false;
		isJoining = false;
		stuurBericht(Commando.SERVER_STOP + " " + cheater);
	}
	
	/**
	 * Verbreekt de verbinding met de client na het bericht te hebben
	 * verzonden.
	 * @param bericht het bericht dat verzonden moet worden
	 */
	public void stuurBye(String bericht) {
		stuurBericht(Commando.SERVER_BYE + " " + bericht);
		if(!isDisconnected) {
			disconnect();
		}
	}

	/**
	 * Voert het commando dat in msg staat uit
	 * @param msg Het commando dat uitgevoerd moet worden
	 * @require msg != null && for(int i = 0; i < msg.length() - 3; i++) {
	 * 							!msg.substring(i, i+1).equals("\n"); }
	 */
	@Override
	protected void executeMessage(String msg) {
		String[] parameters = parseMessage(msg);
		if(parameters.length > 0) {
			if(naam == null && parameters[0].equals(Commando.CLIENT_CONNECT.toString()) && parameters.length >= 2) {
				connect(parameters, msg);
			} else if(naam != null && parameters[0].equals(Commando.CLIENT_JOIN.toString()) && !isPlaying) {
				join(parameters, msg);
			} else if(naam != null && parameters[0].equals(Commando.CLIENT_CHAT.toString()) && parameters.length >= 2) {
				chat(parameters, msg);
			} else if(naam != null && parameters[0].equals(Commando.CLIENT_MOVE.toString()) && parameters.length >= 3 && isPlaying) {
				move(parameters, msg);
			} else if(parameters[0].equals(Commando.CLIENT_DISCONNECT.toString())) {
				if(parameters.length >= 2) {
					System.out.println(naam + " wil de verbinding verbreken: " + eindeVanBericht(msg, 0));
				} else {
					System.out.println(naam + " wil de verbinding verbreken");
				}
				stuurBye("Bedankt voor het spelen");
			} else {
				stuurError("Geen geldig commando");
			}
		} else {
			stuurError("Een lege regel is geen geldig commando");
		}
	}
	
	//----executeMessage() hulpmethodes
	
	/**
	 * Voert het connect commando uit op de juiste manier.
	 * @require parameters.length >= 2
	 */
	private void connect(String[] parameters, String msg) {
		protocolVersie = ProtocolVersie.CHAT.toString().equals(parameters[1]) || ProtocolVersie.VOLLEDIG.toString().equals(parameters[1]) ? ProtocolVersie.CHAT : ProtocolVersie.BASIS;
		if(parameters.length >= 3 && server.isGeldigeNaam(parameters[2])) {
			this.naam = parameters[2];
			stuurAccepted();
			System.out.println(getIpEnPoort() + " krijgt naam " + this.naam);
		} else {
			stuurRefused();
			System.out.println("Naam toekennen aan " + getIpEnPoort() + " geweigerd");
		}
	}
	
	/**
	 * Voert het join commando uit op de juiste manier. Als
	 * de Client al gejoind is wordt het commando 'error'
	 * gestuurd. Als het commando 'join' zonder parameter
	 * wordt ontvangen wordt de speler in een spel met
	 * 2 spelers gezet.
	 * @require !isPlaying
	 */
	private void join(String[] parameters, String msg) {
		try {
			if(parameters.length >= 2 && 2 <= Integer.parseInt(parameters[1]) && Integer.parseInt(parameters[1]) <= 4 && !isJoining) {
				server.join(this, Integer.parseInt(parameters[1]));
				isJoining = true;
				stuurJoinAck();
			} else if(parameters.length == 1 && !isJoining) {
				server.join(this, 2); // bij ontbreken van parameter: join game met 2 spelers
				isJoining = true;
				stuurJoinAck();
			} else if(isJoining) {
				stuurError("Je bent al gejoind!");
			} else {
				stuurError("Protocolfout. Gebuik: \"join [spelers]\" met spelers tussen 2 en 4.");
			}
		} catch (NumberFormatException e) {
			stuurError("Protocolfout. Parameter spelers was geen nummer");
		}
	}
	
	/**
	 * Voert het chat commando uit op de juiste manier.
	 * De chat wordt gebroadcast via het ServerSpel of
	 * via Server, wanneer de Client in een spel zit of
	 * niet.
	 * @require parameters.length >= 2
	 */
	private void chat(String[] parameters, String msg) {
		if(spel == null) {
			server.broadcastChat(this, eindeVanBericht(msg, 0));
		} else {
			spel.broadcastChat(this, eindeVanBericht(msg, 0));
		}
	}
	
	/**
	 * Voert het move commando uit op de juiste manier.
	 * @require parameters.length >= 3 && isPlaying
	 */
	private void move(String[] parameters, String msg) {
		if (isAanDeBeurt) {
	        int x = -1;
	        int y = -1;
	        boolean written = false;
	        try {
	            x = Integer.parseInt(parameters[1]);
	            y = Integer.parseInt(parameters[2]);
	        } catch (NumberFormatException e) {
	            stuurError("Coordinaten waren geen integers");
	            written = true; //voorkom schrijven van coordinaten
	        }
	        while (!written) {
	            try {
	                volgendeZet.put(new int[] { x, y });
	                written = true;
	            } catch (InterruptedException e1) {
	            }
	        }
	    } else {
            stuurError("Je bent niet aan de beurt");
	    }
	}
	
	//---------einde executeMessage() hulpmethodes---------
	
	/**
	 * Stuur de Client het bericht dat zijn connectie
	 * geaccepteerd is.
	 */
	private void stuurAccepted() {
		server.addNaam(naam);
		stuurBericht(Commando.SERVER_ACCEPTED + " " + protocolVersie);
	}
	
	/**
	 * Stuur het 'refused' bericht aan de client, meestal is
	 * de reden een niet geldige naam
	 */
	private void stuurRefused() {
		stuurBericht(Commando.SERVER_REFUSED.toString());
	}
	
	/**
	 * Stuur de client een error commando samen met het bericht.
	 * @param bericht Het bericht dat verstuurd moet worden
	 */
	private void stuurError(String bericht) {
		stuurBericht(Commando.SERVER_ERROR + " " + bericht);
	}
}
