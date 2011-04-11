package canvaskurve.server;

import java.io.IOException;
import java.net.*;
import java.util.*;

/**
 * Een Server voor het Spel rolit. Deze klasse houd
 * onder andere bij welke clients er verbonden zijn en
 * welke spellen er op het moment gespeeld worden. Indien
 * gewenst kan de server gestart worden in een nieuw Thread
 * door Server.start() aan te roepen.
 * @author Nick en Thomas
 */
public class Server extends Thread {

	private static final int POOL_OFFSET = 2;
	
	/**
	 * @invariant namen != null
	 */
	private Set<String> namen;
	/**
	 * @invariant readyToJoin != null
	 */
	private List<ClientHandler> readyToJoin;
	/**
	 * Houd drie arrays bij waarin spelers staan die willen
	 * joinen. De lijsten hebben een lengte van respectievelijk
	 * 2, 3 en 4.
	 * @invariant for(ClientHandler[] pool: joinPools)
	 * 				pool.length = pool.index + POOL_OFFSET
	 * 				for(ClientHandler ch: pool)
	 * 					namen.contains(ch.getNaam()) &&
	 * 					readyToJoin.contains(ch)
	 */
	private ClientHandler[][] joinPools;
	
	/**
	 * @invariant 0 <= port < 65536
	 */
	private int port;

	/**
	 * Start een Server die gaat luisteren op de
	 * poort die is meegegeven als eerste parameter
	 * @param args
	 */
	public static void main(String args[]) {
		if(args.length < 1) {
			System.out.println("Gebruik: rolit.server.Server <port>");
			System.exit(0);
		}
		int port = -1;
		try {
			port = Integer.parseInt(args[0]);
		} catch(NumberFormatException e) {
			System.out.println("Gebruik: rolit.server.Server <port>");
			System.exit(0);
		}
		if(port < 0 || port > 65535) {
			System.out.println("Voer een poort tussen 0 en 65535 in.");
			System.exit(0);
		}
		
		new Server(port).startListening();
	}
	
	/**
	 * Maakt een server die luistert op port.
	 * @param port De poort waar deze server op luistert
	 * @require 0 <= port < 65536
	 */
	public Server(int port) {
		this.port = port;
		readyToJoin = new ArrayList<ClientHandler>();
		namen = new HashSet<String>();
		joinPools = new ClientHandler[3][];
		for(int i = 0; i < joinPools.length; i++) {
			joinPools[i] = new ClientHandler[i + POOL_OFFSET];
		}
	}
	
	/**
	 * Maakt het mogelijk om deze Server te laten luisteren
	 * in een nieuw Thread.
	 */
	@Override
	public void run() {
		startListening();
	}
	
	/**
	 * Start met luisteren op de tijdens het construeren bepaalde poort
	 * Het huidige thread blijft hangen in deze methode!
	 */
	public void startListening() {
		ServerSocket ssock = null;
        try {
			ssock = new ServerSocket(port);
		} catch (IOException e) {
			System.out.println("ServerSocket maken mislukt. Waarschijnlijk is de poort al in gebruik.");
			System.exit(0);
		}
		System.out.println("Hostadres van deze server is " + getHostAdres());
		System.out.println("Gestart met luisteren op poort " + port);
		
		while(true) {
			try {
				Socket sock = ssock.accept();
				ClientHandler handler = new ClientHandler(this, sock);
				addSpeler(handler);
				System.out.println("Client verbonden: " + handler.getIpEnPoort());
				handler.start();
			} catch (IOException e) {
				System.out.println("Verbindingsfout");
			}
		}
	}
	
	/**
	 * Voegt een naam toe aan deze Server, zodat de server
	 * weet welke namen er allemaal met deze Server verbonden zijn
	 * @param naam De naam van de speler
	 * @require naam != null && isGeldigeNaam(naam)
	 */
	public void addNaam(String naam) {
		namen.add(naam);
	}
	
	/**
	 * Bepaalt of deze naam al met deze Server verbonden is
	 * @param naam De naam van deze speler
	 * @return True als de naam nog niet in gebruik is
	 * @require naam != null
	 */
	public boolean isGeldigeNaam(String naam) {
		return !namen.contains(naam);
	}
	
	/**
	 * Plaatst een speler in een pool met spelers aantal spelers
	 * Als de pool vol zit wordt het spel gestart
	 * @param c De betreffende client handler
	 * @param spelers Aantal spelers in de game
	 * @require 2 <= spelers <= 4 && c != null &&
	 * 			c is in readyToJoin
	 */
	public void join(ClientHandler c, int spelers) {
		int i = 0;
		while(i < joinPools[spelers - POOL_OFFSET].length && joinPools[spelers - POOL_OFFSET][i] != null) {
			i++; //zoek naar eerste lege plaats in pool
		}
		joinPools[spelers - POOL_OFFSET][i] = c;
		System.out.println(c.getNaam() + " wacht op een spel met " + spelers + " spelers");
		if(i == spelers - 1) { //if pool is vol
			ServerSpel spel = new ServerSpel(joinPools[spelers - POOL_OFFSET], this);
			for(ClientHandler client: joinPools[spelers - POOL_OFFSET]){
				readyToJoin.remove(client);
			}
			spel.start();
			joinPools[spelers - POOL_OFFSET] = new ClientHandler[spelers];
			System.out.println("Een spel met " + spelers + " is gestart");
		}
	}
	
	/**
	 * Verstuurt een chatbericht naar alle Clients
	 * @param verstuurder De verzender van dit bericht
	 * @param bericht Het chatbericht.
	 */
	public void broadcastChat(ClientHandler verstuurder, String bericht) {
		for(ClientHandler ch: readyToJoin) {
			ch.stuurChat(verstuurder.getNaam(), bericht);
		}
		System.out.println(verstuurder.getNaam() + " zegt: " + bericht);
	}

	/**
	 * Verwijdert de cliënt uit de lijst met spelers
	 * en uit de pools voor joinen
	 * @param c De betreffende ClientHandler
	 */
	public void disconnectClient(ClientHandler c) {
		readyToJoin.remove(c);
		namen.remove(c.getNaam());
		for(int i = 0; i < joinPools.length; i++) {
			for(int j = 0; j < joinPools[i].length; j++) {
				if(joinPools[i][j] == c) {
					//schuif de rest een plek op
					while(j < joinPools[i].length - 1) {
						joinPools[i][j] = joinPools[i][j + 1];
						j++;
					}
					joinPools[i][joinPools[i].length - 1] = null;
				}
			}
		}
		System.out.println("De verbinding met " + c.getNaam() + " is verbroken");
	}

	/** Levert het Internetadres van deze computer op. */
    private String getHostAdres() {
        try {
            return InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            return "?unknown?";
        }
    }
    
    /**
     * Voegt een ClientHandler toe aan de lijst readyToJoin, die deze
     * Server bijhoudt
     * @param ch De nieuwe ClientHandler
     */
    public void addSpeler(ClientHandler ch) {
    	readyToJoin.add(ch);
    }
    
    /**
     * Voegt deze CientHandlers bij de Server, nadat ook ClientHandler.stuurEnd()
     * of ClientHandler.stuurStop() aangeroepen kunnen ze weer een spel joinen.
     * @param ch De ClientHandlers die overgenomen moet worden door de Server
     */
    public void addSpeler(ClientHandler[] ch) {
    	for(ClientHandler client: ch) {
    		addSpeler(client);
    	}
    }
}
