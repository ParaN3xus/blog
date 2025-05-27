// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import * as config from "../config.json";


/**
 * Whether to enable backend, required by click and comment feature.
 */
export const kEnableBackend = true;
/**
 * Whether to enable click tracking.
 */
export const kEnableClick = true && kEnableBackend;
/**
 * Whether to enable comment posting and viewing.
 */
export const kEnableComment = true && kEnableBackend;
/**
 * Whether to enable like reaction.
 */
export const kEnableReaction = true && kEnableBackend;
/**
 * Whether to enable post search (needs Js).
 */
export const kEnableSearch = true;
/**
 * Whether to enable PDF Archive.
 */
export const kEnableArchive = true;
/**
 * Whether to enable printing
 */
export const kEnablePrinting = true && kEnableArchive;

/**
 * The title of the website.
 */
export const kSiteTitle = config.SITE_TITLE;

/**
 * The title of the website.
 */
export const kSiteLogo = "PoeMagie";
/**
 * The title of the website, used in the index page.
 */
export const kSiteIndexTitle = config.SITE_INDEX_TITLE;
/**
 * The description of the website.
 */
export const kSiteDescription = config.SITE_DESCRIPTION;
/**
 * The baidu verification code, used for SEO.
 */
export const kBaiduVeriCode = config.BAIDU_VERIFICATION_CODE;

/**
 * The URL base of the website.
 * - For a GitHub page `https://username.github.io/repo`, the URL base is `/repo/`.
 * - For a netlify page, the URL base is `/`.
 */
export const kUrlBase = config.URL_BASE.replace(/\/$/, "");

/**
 * The click info obtained from the backend.
 */

/**
 * The friend link info.
 */
export const kFriendLinks = [
  {
    name: "7mile",
    url: "https://7li.moe/",
    desc: "一切都有其意义，包括停滞不前的日子。",
  },
  {
    name: "Margatroid",
    url: "https://blog.mgt.moe/",
    desc: "SIGSLEEP Fellow",
  },
];
/**
 * A candidate list of servers to cover people in different regions.
 */
export const kServers = (() => {
  // const BACKEND_ADDR = "http://localhost:13333";
  const BACKEND_ADDR = "https://glittery-valkyrie-8fbf14.netlify.app/api";

  const kServers = [BACKEND_ADDR];

  if (kEnableBackend && kServers.length === 0) {
    throw new Error("kServers is empty, please set kServers in consts.ts");
  }

  return kServers;
})();
