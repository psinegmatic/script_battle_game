import {BattleUnit} from "../battle/BattleUnit";
import {getUnitApi} from './getUnitApi';

export interface IAction {
    action: string;
    id?: any;
    x?: any;
    y?: any;
    text?: any;
}

const MAX_EVAL_TIMEOUT = 1000;

export class CodeSandbox {

    eval(code: string, unit: BattleUnit): Promise<IAction[]> {
        const worker = new Worker(this.getJSBlob(code));

        let resolved = false;

        return new Promise<IAction[]>((resolve, reject) => {
            worker.onmessage = (e) => {
                resolved = true;
                resolve(JSON.parse(e.data));
                worker.terminate();
            };

            setTimeout(() => {
                if (!resolved) {
                    reject(`Max evaluation timeout ${MAX_EVAL_TIMEOUT}ms exceeded`);
                    worker.terminate();
                }
            }, MAX_EVAL_TIMEOUT);

            worker.postMessage(unit.api); // Start the worker.
        });
    }

    private getWorkerCode(codeToInject: string): string {
        return `
            onmessage = (message) => {
                
                const actions = [];
                const unit = message.data;
                
                const unitApi = (${getUnitApi.toString()})(unit, actions);
                const apis = {console, Math, parseInt, parseFloat};
                const nativePostMessage = this.postMessage;
                
                const sandboxProxy = new Proxy(Object.assign(unitApi, apis), {has, get});
                
                Object.keys(this).forEach(key => {
                    delete this[key];
                });
                
                this.Function = function() { return {'неплохо': 'неплохо =)'} };
                
                with (sandboxProxy) {
                    (function() {
                        try {
                            ${codeToInject};
                        } catch (e) {
                            console.error(e);
                        }
                    }).call({"слишком": 'просто'})
                }
                
                function has (target, key) {
                    return true;
                }
                
                function get (target, key) {
                    if (key === Symbol.unscopables) return undefined;
                    return target[key];
                }
            
                nativePostMessage(JSON.stringify(actions));
            }`;
    }

    private getJSBlob(jsCode: string): any {
        const blob = new Blob([this.getWorkerCode(jsCode)], { type: "text/javascript" });

        return URL.createObjectURL(blob);
    }

}