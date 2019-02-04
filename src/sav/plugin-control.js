/**
 * Plugin to manage plugins: loading, enabling/disabling, configuration.
 *
 * Access to the functionality provided by this plugin requires the `host` role.
 * If no such role is defined in the configuration, anyone getting admin by the
 * host or the room script will have access.
 *
 * TODO test and extend
 *
 * Changelog:
 *
 * 1.0.0:
 *  - initial implementation with support for loading plugins from configured
 *    repositories, from raw URL and from pastebin
 */

const room = HBInit();

room.pluginSpec = {
  name: `sav/plugin-control`,
  author: `saviola`,
  version: `1.0.0`,
  dependencies: [
    `sav/core`,
  ],
};

//
// Global variables
//

/**
 * TODO documentation
 */
let roles;

//
// Plugin functions
//

/**
 * TODO documentation
 */
function makeRawUrl(url) {
  if (url.includes(`pastebin`) && !url.contains(`raw`)) {
    return `https://pastebin.com/raw/${url.substr(url.lastIndexOf(`/`) + 1)}`;
  }

  return url;
}

//
// Event handlers
//

/**
 * TODO documentation
 */
async function onCommandPluginLoadHandler(playerId, arguments) {
  if (!roles.ensurePlayerRole(playerId, `host`, room, `plugin load`)) {
    return;
  }

  if (arguments.length === 0) {
    return room.sendChat(`Usage: !plugin load NAME URL, at least one of NAME `
        + `or URL must be specified.`, playerId, HHM.log.level.ERROR);
  }

  let pluginName, pluginUrl;

  if (arguments.length > 1) {
    pluginName = arguments[0];
    pluginUrl = makeRawUrl(arguments[1]);
  } else if (arguments[0].startsWith(`http`)) {
    pluginUrl = makeRawUrl(arguments[0]);
  } else {
    pluginName = arguments[0];
  }

  const pluginLoader = room.getPluginManager().getPluginLoader();
  let pluginId = -1;

  if (typeof pluginUrl !== `undefined`) {
    pluginId = await pluginLoader.tryToLoadPluginByUrl(pluginUrl, pluginName);
  } else if (typeof pluginName !== `undefined`) {
    pluginId = await pluginLoader.tryToLoadPluginByName(pluginName)
  }

  if (pluginId === -1) {
    room.sendChat(`Unable to load plugin ${pluginName} from URL ${pluginUrl}.`,
        playerId, HHM.log.level.ERROR);
  } else {
    room.sendChat(`Plugin ${pluginName} successfully loaded and enabled`);
  }
}

/**
 * TODO documentation
 */
function onRoomLinkHandler() {
  roles = room.getPlugin(`sav/roles`);

  if (!roles.hasRole(`host`)) {
    roles.addOrUpdateRole(`host`);
    room.onPlayerAdminChange = (player, byPlayer) => {
      if (typeof byPlayer !== `undefined` && byPlayer.id !== 0) return;

      roles.setPlayerRole(player, `host`, player.admin);
    }
  }
}

//
// Exports
//

room.onCommand_plugin_load = onCommandPluginLoadHandler;
room.onRoomLink = onRoomLinkHandler;