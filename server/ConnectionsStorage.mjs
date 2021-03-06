import {Master} from "./Master";
import {Player} from "./Player";

export class ConnectionsStorage {

    constructor() {
        this.connections = new Map();

        this.master = new Master(null, 'master');
        this.leftPlayer = new Player(null, 'leftPlayer');
        this.rightPlayer = new Player(null, 'rightPlayer');
    }

    isRegistered(connection) {
        return this.connections.has(connection);
    }

    registerConnection(data, connection) {
        switch (data.type) {
            case 'registerMaster':
                return this.tryRegisterEntity(connection, 'master');
            case 'registerLeftPlayer':
                return this.tryRegisterEntity(connection, 'leftPlayer');
            case 'registerRightPlayer':
                return this.tryRegisterEntity(connection, 'rightPlayer');
        }

        return false;
    }

    tryRegisterEntity(connection, name) {
        if (this[name].connection === null) {
            this[name].setConnection(connection);

            this.connections.set(connection, name);

            console.log(`${name} registered`);

            return true;
        }

        if (this[name].connection !== null) {
            console.warn(`${name} already registered!`);
        }

        return false;
    }

    onConnectionLost(connection) {
        if (this.isRegistered(connection)) {
            const role = this.connections.get(connection);

            this.connections.delete(connection);

            this[role].connection = null;

            console.log(`connection with ${role} lost`);
        }
    }

    setLeftCode(code) {
        this.leftPlayer.setCode(code);
        this.master.dispatchLeftCode(code);
    }

    setRightCode(code) {
        this.rightPlayer.setCode(code);
        this.master.dispatchRightCode(code);
    }

    setLeftState(state) {
        this.leftPlayer.state = Object.assign(this.leftPlayer.state, state);
        this.rightPlayer.setEnemyState(state);
        this.leftPlayer.setEnemyState(this.rightPlayer.state);
        this.master.dispatchLeftState(state);
        this.master.dispatchRightState(this.rightPlayer.state);
    }

    setRightState(state) {
        this.rightPlayer.state = Object.assign(this.rightPlayer.state, state);
        this.leftPlayer.setEnemyState(state);
        this.rightPlayer.setEnemyState(this.leftPlayer.state);
        this.master.dispatchRightState(state);
        this.master.dispatchLeftState(this.leftPlayer.state);
    }

    pushLeftCode(code) {
        this.master.dispatchLeftState(this.leftPlayer.state);
        this.master.pushLeftCode(code);
    }

    pushRightCode(code) {
        this.master.dispatchRightState(this.rightPlayer.state);
        this.master.pushRightCode(code);
    }

    endSession(sessionResult) {
        this.master.dispatchSessionResult(sessionResult);
        this.leftPlayer.dispatchSessionResult(sessionResult);
        this.rightPlayer.dispatchSessionResult(sessionResult);
    }

    newSession() {
        this.master.dispatchNewSession();
        this.leftPlayer.dispatchNewSession();
        this.rightPlayer.dispatchNewSession();
    }

}