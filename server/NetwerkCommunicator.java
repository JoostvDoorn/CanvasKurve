package canvaskurve.server;

import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Een NetwerkCommunicator communiceert over het netwerk
 * via een Socket, een BufferedReader en een BufferedWriter.
 * De implementatie van het ontvangen, versturen en parsen van een
 * bericht zal vaak hetzelfde zijn. Het verbreken van de verbinding
 * en het uitvoeren van een bericht is normaliter anders daarom zijn
 * dat abstracte methodes.
 * @author Nick en Thomas
 */
public abstract class NetwerkCommunicator extends Thread {
	
	/**
	 * @invariant in != null
	 */
	protected BufferedReader in;
	/**
	 * @invariant out != null
	 */
	protected BufferedWriter out;
	/**
	 * De socket verbinding met de client
	 * @invariant sock != null
	 */
	protected Socket sock;
	
	/**
	 * Zet msg in een Array met in elk element 1 woord. msg wordt
	 * gesplitst op spaties.
	 * @param msg Het bericht dat in de Array gezet moet worden
	 * @return msg met in elk element van result een woord
	 * @require msg != null
	 * @ensure result != null && for(String s: result)
	 * 								s != null && s.length() > 0 && !s.contains(" ")
	 */
	protected String[] parseMessage(String msg) {
		Scanner sc = new Scanner(msg);
		sc.useDelimiter(" ");
		List<String> words = new ArrayList<String>();
		while(sc.hasNext()) {
			words.add(sc.next());
		}
		return words.toArray(new String[]{});
	}
	
	/**
	 * Ontvangt een regel van deze client
	 * @return Het commando van de client, null bij een Exception
	 */
	protected String ontvangBericht(){
		String bericht = "";
		try {
			bericht = in.readLine();
		} catch(SocketException e) {
			bericht = null;
		} catch (IOException e) {
			bericht = null;
		}
		return bericht;
	}
	
	/**
	 * Stuur een bericht via de socket. Beter niet te gebruiken na een IOException.
	 * @param bericht Het bericht dat gestuurd moet worden
	 */
	protected void stuurBericht(String bericht) {
		try {
        	out.write(bericht + "\n");
			out.flush();
		} catch (IOException e) {
			disconnect();
		}
	}
	
	/**
	 * Geeft een substring terug vanaf de eerste spatie na het gegeven
	 * aantal spaties overgeslagen te hebben
	 * @param bericht Het bericht waarvan het einde bepaald moet worden
	 * @param spaties Het aantal spaties dat overgeslagen moet worden
	 * @return In bericht: van de eerste spatie tot het eind of "" bij ontbreken van een spatie
	 * @ensure
	 */
	protected String eindeVanBericht(String bericht, int spaties) {
		int i = 0;
		int geteldeSpaties = 0;
		while(i < bericht.length() && geteldeSpaties <= spaties) {
			if(bericht.charAt(i) == ' ') {
				geteldeSpaties++;
			}
			i++;
		}
		return bericht.substring(i);
	}
	
	protected abstract void disconnect();
	
	protected abstract void executeMessage(String msg);
}
