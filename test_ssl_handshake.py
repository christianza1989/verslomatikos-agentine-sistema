import ssl
import socket

hostname = 'reputacija.verslomatika.lt'
ip = '104.21.35.136'
port = 443

ctx = ssl.create_default_context()
with socket.create_connection((ip, port), timeout=5) as sock:
    with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
        print("SSL Handshake SUCCESS!")
        print("Protocol:", ssock.version())
        cert = ssock.getpeercert()
        print("Subject:", cert.get('subject'))
        print("SAN:", [x[1] for x in cert.get('subjectAltName', []) if x[0] == 'DNS'])
