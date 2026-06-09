/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Vault Path - Absolute path to the Hypervault folder. */
  "vaultPath": string,
  /** Claude CLI Path - Path to the claude binary (leave default unless installed elsewhere). */
  "claudePath": string,
  /** Claude OAuth Token - Run `claude setup-token` in Terminal and paste the token here. Lets the box authenticate without Keychain access (Raycast can't read it). */
  "claudeOauthToken"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `capture` command */
  export type Capture = ExtensionPreferences & {}
  /** Preferences accessible in the `ask` command */
  export type Ask = ExtensionPreferences & {}
  /** Preferences accessible in the `process-inbox` command */
  export type ProcessInbox = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `capture` command */
  export type Capture = {}
  /** Arguments passed to the `ask` command */
  export type Ask = {}
  /** Arguments passed to the `process-inbox` command */
  export type ProcessInbox = {}
}

