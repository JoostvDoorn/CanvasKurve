package canvaskurve.server;

import java.util.*;

/**
 * Deze klasse kan een spel op de Server draaien in een
 * apart thread. ServerSpel houdt zelf de spelers bij die meedoen
 * en geeft die weer terug aan Server zodra het spel afgelopen is.
 * @author Nick en Thomas
 */
public class ServerSpel extends Thread {

	/**
	 * Hierin staan de spelers die hier aan meedoen
	 * @invariant 2 <= clients.length <= 4
	 */
	private ClientHandler[] clients;
	private Bord bord;
	private Server server;
	private int beurt;

	/**
	 * Zet de game op en verbindt de spelers.
	 * @param clients De array met clients
	 * @param server De server waarvan dit spel onderdeel is
	 * @require 2 <= clients.length <= 4 &&
	 * 			for(ClientHandler c: clients) c != null &&
	 * 			server != null
	 */
	public ServerSpel(ClientHandler[] clients, Server server) {
		this.server = server;
		shuffleSpelers(clients);
		wijsKleurenToe();
		this.bord = new Bord();
	}
	
	/**
	 * Hierin staat de lus die het spel draait.
	 * In het begin wordt elke client ingelicht dat het
	 * spel start. Aan het einde wordt het resultaat verstuurd.
	 */
	@Override
	public void run() {
		broadcastStart();
		boolean winnaar = false;
		boolean ongeldigeZet = false;
		beurt = 0;
		ClientHandler cheater = null;
		while(!winnaar && !ongeldigeZet){
			broadcastTurn();
			int[] zet = clients[beurt].bepaalZet(bord);
			if(bord.isGeldigeZet(zet[Bord.X], zet[Bord.Y], clients[beurt].getKleur())) {
				bord.setVakje(zet[0], zet[1], clients[beurt].getKleur());
				broadcastZet(zet);
			} else {
				ongeldigeZet = true;
				cheater = clients[beurt];
			}
			winnaar = bord.isAfgelopen();
			beurt = (beurt+1) % clients.length;
		}
		if(winnaar) {
			bepaalEnStuurWinnaar();
			server.addSpeler(clients);
		} else if(ongeldigeZet) {
			for(ClientHandler ch: clients) {
				if(ch != cheater) {
					ch.stuurStop(cheater.getNaam());
					ch.setKleur(null, null);
					server.addSpeler(ch);
				}
			}
			cheater.stuurBye("Je zet was ongeldig, knurft!");
			System.out.println(cheater.getNaam() + " deed een ongeldige zet en is gekickt");
		}
	}

	/**
	 * Verstuurt een chatbericht naar alle Clients behalve
	 * de verstuurder.
	 * @param verstuurder De verzender van dit bericht
	 * @param bericht Het chatbericht.
	 */
	public void broadcastChat(ClientHandler verstuurder, String bericht) {
		for(ClientHandler ch: clients) {
			ch.stuurChat(verstuurder.getNaam(), bericht);
		}
	}
	
	/**
	 * Stuurt het commando 'turn' naar elke client
	 */
	private void broadcastTurn() {
		for(ClientHandler ch: clients) {
			ch.stuurTurn(ch == clients[beurt]);
		}
	}

	/**
	 * Zet de clients in een willekeurige volgorde en plaatst ze in
	 * het attribuut clients
	 * @param clients De clients die geschud moeten worden
	 */
	private void shuffleSpelers(ClientHandler[] clients) {
		List<ClientHandler> shuffled = new ArrayList<ClientHandler>(clients.length);
		for(ClientHandler c: clients) {
			shuffled.add((int) (Math.random() * (shuffled.size() + 1)), c);
		}
		this.clients = shuffled.toArray(new ClientHandler[clients.length]);
	}
	
	/**
	 * Gebruikt de methode ClientHandler.setKleur(Kleur k) om de clients
	 * hun kleuren toe te wijzen volgens de regels van het spel
	 * @ensure for(ClientHandler ch: clients)
	 * 			ch.getKleur() != null
	 */
	private void wijsKleurenToe() {
		clients[0].setKleur(this, Kleur.ROOD);
		clients[1].setKleur(this, clients.length == 2 ? Kleur.GROEN : Kleur.GEEL);
		if(clients.length >= 3) {
			clients[2].setKleur(this, Kleur.GROEN);
		}
		if(clients.length >= 4) {
			clients[3].setKleur(this, Kleur.BLAUW);
		}
	}
	
	/**
	 * Broadcast naar alle spelers wie er meedoen aan dit spel.
	 * Uit de volgorde blijkt ook wie welke kleur krijgt.
	 */
	private void broadcastStart() {
		String namen = "";
		for(ClientHandler ch: clients) {
			namen += ch.getNaam() + " ";
		}
		for(ClientHandler ch: clients) {
			ch.stuurStart(namen);
		}
	}
	
	/**
	 * Verstuurt deze zet naar alle clients
	 * @param zet De zet die verstuurd moet worden
	 * @require zet != null && 
	 * 			0 <= zet[Bord.X] < Bord.BREEDTE &&
	 * 			0 <= zet[Bord.Y] < Bord.HOOGTE
	 */
	private void broadcastZet(int[] zet) {
		for(ClientHandler ch: clients) {
			ch.stuurMove(zet);
		}
	}
	
	/**
	 * Bepaalt wie de winnaar(s) is/zijn en stuurt dat naar
	 * alle clients.
	 * @require bord.isAfgelopen()
	 */
	private void bepaalEnStuurWinnaar() {
		Kleur[] kleurVanWinnaar = bord.bepaalWinnaar();
		String winnaars = "";
		for(Kleur k: kleurVanWinnaar) {
			for(ClientHandler ch: clients) {
				if(ch.getKleur() == k) {
					winnaars += ch.getNaam() + " ";
				}
			}
		}
		for(ClientHandler ch: clients) {
			ch.stuurEnd(winnaars);
			ch.setKleur(null, null);
		}
		System.out.println("Een spel is geëindigs met " + winnaars + " als winnaar(s)");
	}
}
