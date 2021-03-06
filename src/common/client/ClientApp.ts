import {WebsocketConnection} from '../WebsocketConnection';
import {Inject, setInject} from '../InjectDectorator';
import {BattleGame, BattleState} from '../battle/BattleGame';
import {EditorComponent} from '../editor/EditorComponent';
import {BattleSide} from '../battle/BattleSide';
import {ClientState} from "./ClientState";
import {LeftArmy} from "../../left/LeftArmy";
import {EnemyState} from "./EnemyState";
import {RightArmy} from "../../right/RightArmy";
import {ISessionResult} from "../battle/BattleSession";

export class ClientApp {

    @Inject(BattleGame) private battleGame: BattleGame;
    @Inject(EnemyState) private enemyState: EnemyState;
    @Inject(ClientState) private clientState: ClientState;
    @Inject(WebsocketConnection) private connection: WebsocketConnection;

    private editorComponent: EditorComponent;

    constructor(private side: BattleSide) {

        this.clientState.side = side;

        if (side === BattleSide.left) {
            this.connection.registerAsLeftPlayer();

            setInject(LeftArmy, this.clientState.army);
            setInject(RightArmy, this.enemyState.army);
        } else {
            this.connection.registerAsRightPlayer();

            setInject(LeftArmy, this.enemyState.army);
            setInject(RightArmy, this.clientState.army);
        }

        this.battleGame.setState(BattleState.battle);

        this.editorComponent = new EditorComponent();

        this.editorComponent.runCode$.subscribe(code => {
            if (side === BattleSide.left) {
                this.battleGame.runCode(code, '');
            } else {
                this.battleGame.runCode('', code);
            }
        });

        this.editorComponent.pushCode$.subscribe(code => {
            if (side === BattleSide.left) {
                this.connection.pushLeftCode(code);
            } else {
                this.connection.pushRightCode(code);
            }
        });

        this.editorComponent.change$.subscribe(code => {
            if (side === BattleSide.left) {
                this.connection.sendLeftCode(code);
            } else {
                this.connection.sendRightCode(code);
            }
        });

        this.connection.onMessage$.subscribe(message => {
            if (message.type === 'state') {
                this.battleGame.setState(message.data);
            }

            if (message.type === 'endSession') {
                const sessionResult = <ISessionResult>message.data.sessionResult;

                if (sessionResult.winner.toString() === this.clientState.side) {
                    this.battleGame.showWinnerScreen(message.data.sessionResult);
                } else {
                    this.battleGame.showLoseScreen(message.data.sessionResult);
                }
            }

            if (message.type === 'newSession') {
                location.reload();
            }
        });

        this.connection.onClose$.subscribe(() => {
            this.battleGame.setState(BattleState.connectionClosed);
        });

    }

}