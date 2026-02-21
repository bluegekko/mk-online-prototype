const peerConnection = {
    peer: null,
    connection: null,
    isHost: false,
    
    startHost: function(gameId) {
        this.peer = new Peer(gameId);
        this.isHost = true;
        
        this.peer.on('open', (id) => {
            console.log('Host peer ID:', id);
            console.log('Host ready, waiting for connections...');
        });
        
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            console.log('Client connected:', conn.peer);
            
            conn.on('data', (data) => {
                console.log('Received:', data);
            });
            
            conn.on('open', () => {
                console.log('Connection opened with client');
            });
        });
    },
    
    joinGame: function(hostId) {
        this.peer = new Peer();
        this.isHost = false;
        
        this.peer.on('open', () => {
            console.log('Join peer created, attempting to connect to:', hostId);
            this.connection = this.peer.connect(hostId);
            
            this.connection.on('open', () => {
                console.log('Successfully connected to host:', hostId);
            });
            
            this.connection.on('data', (data) => {
                console.log('Received from host:', data);
            });
            
            this.connection.on('error', (err) => {
                console.error('Connection error:', err);
            });
        });
    },
    
    sendMessage: function(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        }
    },
    
    disconnect: function() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
        this.peer = null;
        this.connection = null;
        this.isHost = false;
    }
};