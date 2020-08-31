import { HttpService, JovoError, User } from 'jovo-core';
import { ConversationalActionRequest } from './ConversationalActionRequest';
import uuidv4 = require('uuid/v4');
import { GoogleAction } from './GoogleAction';

export interface UserProfile {
  displayName: string;
  givenName: string;
  familyName: string;
}

export interface GoogleAccountProfile {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;

  [key: string]: string | boolean;
}

export class ConversationalActionUser extends User {
  conversationalAction: GoogleAction;

  $params: any = {}; // tslint:disable-line

  constructor(conversationalAction: GoogleAction) {
    super(conversationalAction);
    this.conversationalAction = conversationalAction;

    this.$params = {
      ...(conversationalAction.$request as ConversationalActionRequest).user!.params,
    };

    if (!this.$params.userId) {
      this.$params.userId = uuidv4();
    }
  }

  /**
   * Returns user id
   * @returns {string | undefined}
   */
  getId(): string | undefined {
    return this.$params.userId;
  }

  async getGoogleProfile(): Promise<GoogleAccountProfile> {
    const token = this.conversationalAction.$host.headers['authorization'];

    if (!token) {
      throw new JovoError('No valid authorization token found. Make sure account linking worked!');
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;

    try {
      const response = await HttpService.get<GoogleAccountProfile>(url);
      if (response.status === 200 && response.data) {
        return response.data as GoogleAccountProfile;
      }
      throw new JovoError(`Couldn't load user profile: ${JSON.stringify(response.data)}`);
    } catch (e) {
      throw e;
    }
  }
}
