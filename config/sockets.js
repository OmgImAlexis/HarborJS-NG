const {Writable} = require('stream');
const exec = require('ssh-exec');

module.exports = (io, credentials, docker) => {
    const streamToWebsocket = (stream, socket) => {
        stream._write = (chunk, enc, next) => {
            socket.emit('logs', {
                data: chunk.toString()
            });
            next();
        };
    };

    io.sockets.on('connection', socket => {
        socket.on('thisContainerId', id => {
            const container = docker.container.get(id);
            container.logs({stream: true, stdout: true, stderr: true, logs: true}, stream => {
                const out = new Writable();
                const err = new Writable();
                streamToWebsocket(out, socket);
                streamToWebsocket(err, socket);
                container.modem.demuxStream(stream, out, err);
            });
        });

        socket.on('sshkey', data => {
            exec(`touch ssh.pub ; echo ${data.mysshkey} > ssh.pub; cat ~/ssh.pub | sudo sshcommand acl-add dokku ${data.name}`, credentials).pipe(process.stdout);
        });

        socket.on('containerId', data => {
            exec(`docker kill ${data.idcont}; sudo rm -r /home/dokku/${data.namecont}`, credentials).pipe(process.stdout);
        });

        socket.on('dbCreate', ({name, type}) => exec(`dokku ${type}:create ${name}`, credentials).pipe(process.stdout));

        socket.on('cmd', ({cmd, name}) => exec(`dokku run ${name} ${cmd}`, credentials).pipe(process.stdout));

        socket.on('dbLink', data => {
            const app = data.appName;
            const db = data.dbName;
            exec(`dokku postgresql:link ${app} ${db}; dokku mysql:link ${app} ${db}; dokku redis:link ${app} ${db}`, credentials).pipe(process.stdout);
        });
    });
};
