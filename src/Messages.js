'use strict';

/**
 * This file contains a map of messages used by the skill.
 */

const WELCOME = "Welcome to the CareFinder Skill!";

const WHAT_DO_YOU_WANT = "What do you want to ask?";

const SAY_THAT_AGAIN = "Please say that again?";

const NOTIFY_MISSING_PERMISSIONS = "Please enable Location permissions in the Amazon Alexa app.";

const NO_ADDRESS = "It looks like you don't have an address set. Please set your address in the Amazon Alexa app.";

const NO_FULL_ADDRESS = "It looks like you don't have a full address set. Please set your full address in the Amazon Alexa app."

const ADDRESS_AVAILABLE = "Here is your full address: ";

const ERROR = "Uh Oh. Looks like something went wrong.";

const LOCATION_FAILURE = "There was an error with the Device Address API. Please try again.";

const GOODBYE = "GoodBye! Thanks for using the CareFinder Skill!";

const UNHANDLED = "This skill doesn't support that. Please ask something else.";

const HELP = " You can use this skill by asking something like:What's the closest ER?"
  + "Or, what's the closest ER near zipcode or address.";

const HELP_GENERIC = " You can say Help or Stop any time."  

module.exports = {
    "WELCOME": WELCOME,
    "WHAT_DO_YOU_WANT": WHAT_DO_YOU_WANT,
    "SAY_THAT_AGAIN": SAY_THAT_AGAIN,
    "NOTIFY_MISSING_PERMISSIONS": NOTIFY_MISSING_PERMISSIONS,
    "NO_ADDRESS": NO_ADDRESS,
    "NO_FULL_ADDRESS": NO_FULL_ADDRESS,
    "ADDRESS_AVAILABLE": ADDRESS_AVAILABLE,
    "ERROR": ERROR,
    "LOCATION_FAILURE": LOCATION_FAILURE,
    "GOODBYE": GOODBYE,
    "UNHANDLED": UNHANDLED,
    "HELP": HELP,
    "HELP_GENERIC": HELP_GENERIC
};