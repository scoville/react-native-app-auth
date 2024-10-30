const { createRunOncePlugin, } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");
const { macos } = require("react-native-test-app/plugins/index");

function withCustomAppDelegate(config) {
  // This is tricky. We ideally want to register a deeplink handler during
  // applicationWillFinishLaunching, but that string appears twice (once for
  // each possible value of ENABLE_SINGLE_APP_MODE) so the config plugin will
  // probably only match the first one of the two.
  //
  // We also want to declare a variable
  return macos.withAppDelegate(config, (config) => {
    // See:
    // - examples/demo/node_modules/react-native-test-app/macos/ReactTestApp/AppDelegate.swift
    // - https://github.com/microsoft/react-native-test-app/pull/2160#issue-2435799831
    config.modResults.contents = mergeContents({
      tag: "config-plugin.js",
      src: config.modResults.contents,
      newSrc: `
extension AppDelegate: RNAppAuthAuthorizationFlowManager {}
`.trim(),
      anchor: /extension AppDelegate {/,
      offset: 0,
      comment: "//",
    }).contents;

    // We could do a RegEx that matches some pattern based on
    // `#if ENABLE_SINGLE_APP_MODE` but that seems fragile against future
    // changes.
    config.modResults.contents = mergeContents({
      tag: "config-plugin.js",
      src: config.modResults.contents,
      newSrc: `
// Testing!!
`.trim(),
      anchor: /#if !ENABLE_SINGLE_APP_MODE.*func applicationWillFinishLaunching\(_: Notification\) {/m,
      offset: 0,
      comment: "//",
    }).contents;

    return config;
  });
}

module.exports = createRunOncePlugin(
  withCustomAppDelegate,
  "test-plugin.js",
  "UNVERSIONED"
);
