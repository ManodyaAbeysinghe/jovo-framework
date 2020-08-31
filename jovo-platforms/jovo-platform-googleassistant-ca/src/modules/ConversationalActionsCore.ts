import { Plugin, HandleRequest, EnumRequestType, SpeechBuilder, Log } from 'jovo-core';
import _set = require('lodash.set');
import _get = require('lodash.get');

import { GoogleAssistant } from '../GoogleAssistant';
import { GoogleActionSpeechBuilder } from '../core/GoogleActionSpeechBuilder';
import {
  Card,
  Collection,
  EnumGoogleAssistantRequestType,
  Image,
  List,
  Simple,
  Table,
  TypeOverride,
  User,
} from '../core/Interfaces';
import { GoogleAction } from '../core/GoogleAction';
import { ConversationalActionRequest } from '../core/ConversationalActionRequest';
import { ConversationalActionResponse } from '../core/ConversationalActionResponse';
import { ConversationalActionUser } from '../core/ConversationalActionUser';

export class ConversationalActionsCore implements Plugin {
  install(googleAssistant: GoogleAssistant) {
    googleAssistant.middleware('$init')!.use(this.init.bind(this));
    googleAssistant.middleware('$type')!.use(this.type.bind(this));
    googleAssistant.middleware('$nlu')!.use(this.nlu.bind(this));
    googleAssistant.middleware('$inputs')!.use(this.inputs.bind(this));
    // googleAssistant.middleware('after.$type')!.use(this.userStorageGet.bind(this));
    googleAssistant.middleware('$session')!.use(this.session.bind(this));
    googleAssistant.middleware('$output')!.use(this.output.bind(this));
    // googleAssistant.middleware('after.$output')!.use(this.userStorageStore.bind(this));

    GoogleAction.prototype.addFirstSimple = function (firstSimple: Simple) {
      _set(this.$output, 'GoogleAssistant.firstSimple', firstSimple);
      return this;
    };
    GoogleAction.prototype.addLastSimple = function (lastSimple: Simple) {
      _set(this.$output, 'GoogleAssistant.lastSimple', lastSimple);
      return this;
    };
    GoogleAction.prototype.addCard = function (card: Card) {
      _set(this.$output, 'GoogleAssistant.card', card);
      return this;
    };
    GoogleAction.prototype.addImage = function (image: Image) {
      _set(this.$output, 'GoogleAssistant.image', image);
      return this;
    };

    GoogleAction.prototype.addBasicCard = function (basicCard: Card) {
      return this.addCard(basicCard);
    };
    GoogleAction.prototype.addImageCard = function (imageCard: Image) {
      return this.addImage(imageCard);
    };

    GoogleAction.prototype.addTable = function (table: Table) {
      _set(this.$output, 'GoogleAssistant.table', table);
      return this;
    };

    GoogleAction.prototype.addList = function (list: List) {
      _set(this.$output, 'GoogleAssistant.list', list);
      return this;
    };

    GoogleAction.prototype.addCollection = function (collection: Collection) {
      _set(this.$output, 'GoogleAssistant.collection', collection);
      return this;
    };

    GoogleAction.prototype.addTypeOverrides = function (typeOverrides: TypeOverride[]) {
      _set(this.$output, 'GoogleAssistant.typeOverrides', typeOverrides);
      return this;
    };
  }

  async init(handleRequest: HandleRequest) {
    const requestObject = handleRequest.host.$request;
    /**
     * placeholder, since GoogleAction can't be run without dialogflow currently.
     * Platform object creation is therefore handled by dialogflow integration.
     */
    if (
      requestObject.user &&
      requestObject.session &&
      requestObject.handler &&
      requestObject.device
    ) {
      handleRequest.jovo = new GoogleAction(handleRequest.app, handleRequest.host, handleRequest);
    }
  }

  type(googleAction: GoogleAction) {
    const request = googleAction.$request as ConversationalActionRequest;
    if (
      request.intent?.name === 'actions.intent.MAIN' &&
      !request.session?.params._JOVO_SESSION_ // &&
      // TODO: is it necessary? request.scene?.name === 'actions.scene.START_CONVERSATION'
    ) {
      googleAction.$type = {
        type: EnumRequestType.LAUNCH,
      };
    } else if (request.intent?.name === 'actions.intent.CANCEL') {
      googleAction.$type = {
        type: EnumRequestType.END,
      };
    } else if (
      request.intent?.params.prompt_option &&
      request.scene?.slotFillingStatus === 'FINAL'
    ) {
      googleAction.$type = {
        type: EnumRequestType.ON_ELEMENT_SELECTED,
        subType: _get(request, 'intent.params.prompt_option.resolved'),
      };
    } else if (request.intent?.name) {
      googleAction.$type = {
        type: EnumRequestType.INTENT,
      };
    }

    const isElementSelectedType = googleAction.$type.type === EnumRequestType.ON_ELEMENT_SELECTED;

    if (request.intent?.name === 'actions.intent.NO_INPUT_1' && !isElementSelectedType) {
      if (googleAction.$config.handlers[EnumGoogleAssistantRequestType.ON_NOINPUT1]) {
        googleAction.$type = {
          type: EnumGoogleAssistantRequestType.ON_NOINPUT1,
        };
      } else {
        const noinput1 = _get(request, 'session.params._JOVO_SESSION_.reprompts.NO_INPUT1');
        if (noinput1) {
          googleAction.ask(noinput1, noinput1); //TODO: find better solution
          googleAction.$type = {
            type: EnumGoogleAssistantRequestType.ON_NOINPUT1,
          };
        } else {
          googleAction.$type = {
            type: EnumRequestType.END,
          };
        }

        googleAction.$handleRequest!.excludedMiddlewareNames = [
          'platform.nlu',
          'asr',
          'platform.nlu',
          'nlu',
          'user.load',
          'asr',
          'handler',
          'user.save',
          'tts',
        ];
      }
    }

    if (request.intent?.name === 'actions.intent.NO_INPUT_2' && !isElementSelectedType) {
      if (googleAction.$config.handlers[EnumGoogleAssistantRequestType.ON_NOINPUT2]) {
        googleAction.$type = {
          type: EnumGoogleAssistantRequestType.ON_NOINPUT2,
        };
      } else {
        const noinput2 = _get(request, 'session.params._JOVO_SESSION_.reprompts.NO_INPUT2');
        if (noinput2) {
          googleAction.ask(noinput2, noinput2); //TODO: find better solution
          googleAction.$type = {
            type: EnumGoogleAssistantRequestType.ON_NOINPUT2,
          };
        } else {
          googleAction.$type = {
            type: EnumRequestType.END,
          };
        }

        googleAction.$handleRequest!.excludedMiddlewareNames = [
          'platform.nlu',
          'asr',
          'platform.nlu',
          'nlu',
          'user.load',
          'asr',
          'handler',
          'user.save',
          'tts',
        ];
      }
    }

    if (request.intent?.name === 'actions.intent.NO_INPUT_FINAL' && !isElementSelectedType) {
      if (googleAction.$config.handlers[EnumGoogleAssistantRequestType.ON_NOINPUTFINAL]) {
        googleAction.$type = {
          type: EnumGoogleAssistantRequestType.ON_NOINPUT2,
        };
      } else {
        const noinputfinal = _get(request, 'session.params._JOVO_SESSION_.reprompts.NO_INPUTFINAL');
        if (noinputfinal) {
          googleAction.ask(noinputfinal, noinputfinal); //TODO: find better solution
          googleAction.$type = {
            type: EnumGoogleAssistantRequestType.ON_NOINPUTFINAL,
          };
        } else {
          googleAction.$type = {
            type: EnumRequestType.END,
          };
        }

        googleAction.$handleRequest!.excludedMiddlewareNames = [
          'platform.nlu',
          'asr',
          'platform.nlu',
          'nlu',
          'user.load',
          'asr',
          'handler',
          'user.save',
          'tts',
        ];
      }
    }
  }

  async nlu(googleAction: GoogleAction) {
    const request = googleAction.$request as ConversationalActionRequest;

    if (
      request.getIntentName() &&
      googleAction.$type &&
      googleAction.$type.type === EnumRequestType.INTENT
    ) {
      googleAction.$nlu = {
        intent: {
          name: request.getIntentName()!,
        },
      };
    }
  }

  async inputs(googleAction: GoogleAction) {
    const request = googleAction.$request as ConversationalActionRequest;

    googleAction.$inputs = request.getInputs();
  }

  async session(googleAction: GoogleAction) {
    const request = googleAction.$request as ConversationalActionRequest;

    googleAction.$session.$data = {
      ...request.session?.params,
    };

    if (!googleAction.$session.$data._JOVO_SESSION_?.new) {
      googleAction.$conversationalSession = {
        createdAt: new Date().toISOString(),
        new: true,
      };
    } else {
      googleAction.$conversationalSession = {
        ...googleAction.$session.$data._JOVO_SESSION_,
        new: false,
      };
      googleAction.$session.$data._JOVO_SESSION_.new = false;
    }
  }

  async output(googleAction: GoogleAction) {
    const output = googleAction.$output;
    const request = googleAction.$request as ConversationalActionRequest;

    const response = googleAction.$response as ConversationalActionResponse;

    const tell = output?.GoogleAssistant?.tell || output?.tell;
    _set(googleAction.$response as ConversationalActionResponse, 'scene.next.name', '');
    if (tell) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.firstSimple.speech',
        GoogleActionSpeechBuilder.toSSML(tell.speech as string),
      );
      _set(
        googleAction.$response as ConversationalActionResponse,
        'scene.next.name',
        'actions.scene.END_CONVERSATION',
      );
    }

    const ask = output?.GoogleAssistant?.ask || output?.ask;

    if (ask) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.firstSimple.speech',
        GoogleActionSpeechBuilder.toSSML(ask.speech as string),
      );

      if (!googleAction.$conversationalSession.reprompts) {
        let input1, input2, final;

        if (Array.isArray(ask.reprompt) && ask.reprompt[0]) {
          input1 = ask.reprompt[0];
        } else if (typeof ask.reprompt === 'string') {
          input1 = ask.reprompt;
        }

        if (Array.isArray(ask.reprompt) && ask.reprompt[1]) {
          input2 = ask.reprompt[1];
        } else if (typeof ask.reprompt === 'string') {
          input2 = ask.reprompt;
        }

        if (Array.isArray(ask.reprompt) && ask.reprompt[2]) {
          final = ask.reprompt[2];
        } else if (typeof ask.reprompt === 'string') {
          final = ask.reprompt;
        }

        googleAction.$conversationalSession.reprompts = {
          NO_INPUT1: input1 ? SpeechBuilder.toSSML(input1) : undefined,
          NO_INPUT2: input2 ? SpeechBuilder.toSSML(input2) : undefined,
          NO_INPUTFINAL: final ? SpeechBuilder.toSSML(final) : undefined,
        };
      }
    }

    if (output.GoogleAssistant?.firstSimple) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.firstSimple',
        output.GoogleAssistant.firstSimple,
      );
    }

    if (output.GoogleAssistant?.lastSimple) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.lastSimple',
        output.GoogleAssistant.lastSimple,
      );
    }

    if (output.card?.SimpleCard) {
      _set(googleAction.$response as ConversationalActionResponse, 'prompt.content.card', {
        title: output.card?.SimpleCard.title,
        text: output.card?.SimpleCard.content,
      });
    }
    if (output.card?.ImageCard) {
      _set(googleAction.$response as ConversationalActionResponse, 'prompt.content.card', {
        title: output.card?.ImageCard.title,
        text: output.card?.ImageCard.content,
        image: {
          url: output.card?.ImageCard.imageUrl,
          alt: output.card?.ImageCard.title,
        },
      });
    }

    if (output.GoogleAssistant?.card) {
      if (!output.GoogleAssistant.card.text) {
        Log.warn(`Missing required 'text' value in card object`);
      }

      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.content.card',
        output.GoogleAssistant.card,
      );
    }

    if (output.GoogleAssistant?.image) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.content.image',
        output.GoogleAssistant.image,
      );
    }

    if (output.GoogleAssistant?.table) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.content.table',
        output.GoogleAssistant.table,
      );
    }
    if (output.GoogleAssistant?.list) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.content.list',
        output.GoogleAssistant.list,
      );
    }

    if (output.GoogleAssistant?.collection) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'prompt.content.collection',
        output.GoogleAssistant.collection,
      );
    }

    response.user = {
      params: {
        ...(googleAction.$user as ConversationalActionUser).$params,
      },
    } as User;

    if (!tell || _get(googleAction.$app.config, 'keepSessionDataOnSessionEnded')) {
      // TODO: needs to be tested
      response.session = {
        id: request.session?.id!,
        params: {
          _JOVO_SESSION_: googleAction.$conversationalSession,
          ...googleAction.$session.$data,
        },
      };
    }
    // _set(googleAction.$response as ConversationalActionResponse, 'scene.next.name', 'ListPrompt');
    if (output.GoogleAssistant?.typeOverrides) {
      _set(
        googleAction.$response as ConversationalActionResponse,
        'session.typeOverrides',
        output.GoogleAssistant?.typeOverrides,
      );
    }
  }
  uninstall(googleAssistant: GoogleAssistant) {}
}
