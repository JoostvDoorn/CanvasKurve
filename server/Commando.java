package canvaskurve.server;

/**
 * Commando bevat alle commando's die van een client naar
 * een Server worden gestuurd en vice versa. Commando's die
 * door de Server wordt gestuurd beginnen met SERVER_; Commando's
 * die door een Client worden gestuurd beginnen met CLIENT_.
 * @author Nick en Thomas
 */
public enum Commando {
	CLIENT_CONNECT 		("connect"),
	CLIENT_JOIN 		("join"),
	CLIENT_CHAT			("chat"),
	CLIENT_MOVE 		("move"),
	CLIENT_DISCONNECT 	("disconnect"),
	
	SERVER_ACCEPTED 	("accepted"),
	SERVER_REFUSED 		("refused"),
	SERVER_ERROR 		("error"),
	SERVER_JOINACK 		("join_ack"),
	SERVER_CHAT			("chat"),
	SERVER_START 		("start"),
	SERVER_TURN 		("turn"),
	SERVER_MOVE 		("move"),
	SERVER_END 			("end"),
	SERVER_STOP 		("stop"),
	SERVER_BYE 			("bye");
	
	private String commando;
	private Commando(String s) {
		commando = s;
	}
	
	@Override
	public String toString() {
		return commando;
	}
}
