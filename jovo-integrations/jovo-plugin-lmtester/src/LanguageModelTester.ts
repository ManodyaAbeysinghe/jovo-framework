import {Plugin, PluginConfig, BaseApp, HandleRequest, EnumRequestType} from 'jovo-core';
import * as _ from "lodash";

interface Config extends PluginConfig {
    startText: string;
}

export class LanguageModelTester implements Plugin {

    config: Config = {
        startText: 'Start',
    };

    constructor(config?: Config) {
        if (config) {
            this.config = _.merge(this.config, config);
        }

    }

    install(app: BaseApp) {
        if (process.argv.indexOf('--model-test') > -1 ) {
            app.middleware('after.logic.router')!.use(this.testModel.bind(this));
            app.middleware('initialize.user')!.skip();
            app.middleware('initialize.cms')!.skip();
            app.middleware('logic.handler')!.skip();
            app.middleware('finalize.user')!.skip();
        }
    }

    testModel(handleRequest: HandleRequest) {
        if (!handleRequest.jovo) {
            return Promise.resolve();
        }

        if (!handleRequest.jovo.$type) {
            return Promise.resolve();
        }


        if (handleRequest.jovo.$type.type === EnumRequestType.LAUNCH) {
            handleRequest.jovo.ask(this.config.startText, this.config.startText);
        } else if (handleRequest.jovo.$type.type === EnumRequestType.INTENT) {

            // skip END requests
            if (_.get(handleRequest.jovo.$plugins, 'Router.route.path') === 'END') {
                return;
            }

            if (handleRequest.jovo.$nlu && handleRequest.jovo.$nlu.intent) {
                console.log();
                console.log('Intent:');
                console.log('  ' + handleRequest.jovo.$nlu.intent.name);

                if (handleRequest.jovo.$inputs) {
                    if (Object.keys(handleRequest.jovo.$inputs).length > 0) {
                        console.log();
                        console.log('Inputs:');
                    }

                    for (const key of Object.keys(handleRequest.jovo.$inputs)) {
                        const input = handleRequest.jovo.getInput(key);
                        if (input) {
                            let out = `${key}: ${input.value ? input.value : ''}`;

                            if (_.get(input, 'alexaSkill.resolutions.resolutionsPerAuthority[0].status.code') &&
                                _.get(input, 'alexaSkill.resolutions.resolutionsPerAuthority[0].status.code') !== 'ER_SUCCESS_MATCH') {
                                out += ` (${_.get(input, 'alexaSkill.resolutions.resolutionsPerAuthority[0].status.code')})`;
                            }

                            console.log('  ' + out);
                        }

                    }
                }

                console.log();
                console.log(' -----------------------------');

                handleRequest.jovo.ask(handleRequest.jovo.$nlu.intent.name, 'Say the next phrase');
            }
        }
    }

    uninstall(app: BaseApp) {

    }
}