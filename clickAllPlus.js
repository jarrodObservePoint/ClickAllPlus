/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// USER CONFIGURATION //////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Include filter must include the following after the domain: .*opClickAllData.*
// e.g., https://example.com.*opClickAllData.*
// Add two new Data Layer objects within the sub-folder: interactionObject, interactionValidation

const INTERACTION_TYPES = [
  {
    selector: "selector",
    targetedElementsType: "test",
    limitInteractions: Infinity, // Set max number of elements to interact with; leave as Infinity to interact with all that apply
    elementAttributeData: "test,test", // Leave blank if not applicable
    action: function (element) {
      // Function that will perform action on elements found; if no 'action' specified in configuration (removing this action attribute), defaults to a click simulation
      simulateClick(element);
    },
  },
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Simulates a click event on the specified element.
 * @param {Element} element - The DOM element to simulate the click on.
 */
function simulateClick(element) {
  ["mousedown", "mouseup", "click"].forEach((eventType) => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
  });
}

/**
 * Global objects used for audit validation purposes.
 */
const interactionValidation = {};
const interactionObject = {
  "Element Selector": "",
};

(() => {
  /**
   * Generates a unique CSS selector for the given element.
   * @param {Element} element - The DOM element to generate the selector for.
   * @returns {string|null} - The unique CSS selector or null if not unique.
   */
  function generateQuerySelector(element) {
    if (!(element instanceof Element)) return null;
    const paths = [];

    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();

      // Include the ID if present, but don't assume it's unique
      if (element.id && !uuidCheck(element.id)) {
        selector += `[id="${CSS.escape(element.id)}"]`;
      }

      // Add all classes
      const classList = Array.from(element.classList)
        .filter(Boolean)
        .map((cls) => "." + CSS.escape(cls));
      selector += classList.join("");

      // Check if we need to add nth-of-type
      if (element.parentNode) {
        const parent = element.parentNode;
        const tagName = element.nodeName.toLowerCase();
        const siblings = Array.from(parent.children).filter(
          (sibling) => sibling.nodeName.toLowerCase() === tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(element) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      paths.unshift(selector);

      const fullSelector = paths.join(" > ");

      // Verify that the selector uniquely identifies the element
      if (document.querySelectorAll(fullSelector).length === 1) {
        return fullSelector;
      }

      element = element.parentElement;
    }

    const fullSelector = paths.join(" > ");

    // Final check for uniqueness
    if (document.querySelectorAll(fullSelector).length === 1) {
      return fullSelector;
    } else {
      // If not unique, return null or handle accordingly
      console.warn("Selector is not unique:", fullSelector);
      return null;
    }

    function uuidCheck(s) {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidPattern.test(s);
    }
  }

  async function main() {
    try {
      const opClickAllData = getOpDataParam(window.location.href);
      if (opClickAllData) {
        await handleInteraction(opClickAllData);
      } else {
        const linkSelectors = await getLinkSelectors(INTERACTION_TYPES);
        if (linkSelectors.length > 0) {
          addLinksToPage(linkSelectors);
          console.log(
            `${linkSelectors.length} links found on page matching configuration`
          );
        } else {
          console.log("No matching elements found for interaction types.");
        }
      }
    } catch (error) {
      console.error("An error occurred in main:", error);
    }
  }

  main();

  async function handleInteraction(allData) {
    const interactionElementSelector = allData["interactedElement"];
    interactionObject["Element Selector"] = interactionElementSelector;
    const interactionElement = document.querySelector(
      interactionElementSelector
    );

    if (interactionElement) {
      interactionObject["Element Inner Text"] = interactionElement.innerText;
      if (interactionElement.href)
        interactionObject["href"] = interactionElement.href;

      if (allData["elementAttributeData"] !== undefined) {
        const datas = allData["elementAttributeData"].split(",");
        datas.forEach((d) => {
          interactionValidation[d] =
            interactionElement.getAttribute(d) || "DATA ELEMENT MISSING";
        });
      }

      if (
        interactionElement.hasAttribute("target") &&
        interactionElement.getAttribute("target") === "_blank"
      ) {
        interactionElement.setAttribute("target", "_self");
      }

      performAction(interactionElement, allData["targetedElementsType"]);
      colorElement(interactionElement, interactionObject);
      console.log(interactionElement);
    } else {
      interactionObject["Element Selector"] = "ELEMENT NO LONGER AVAILABLE";
      console.warn(
        "Interaction element not found:",
        interactionElementSelector
      );
    }
  }

  function performAction(element, targetedElementsType) {
    const targetedElementsTypeObjs = INTERACTION_TYPES.filter(
      (l) => l.targetedElementsType === targetedElementsType
    );

    if (targetedElementsTypeObjs.length === 0) {
      console.log(
        "No configuration for targetedElementsType:",
        targetedElementsType
      );
      return;
    }

    const actionObj = targetedElementsTypeObjs[0];
    if (actionObj.action && typeof actionObj.action === "function") {
      actionObj.action(element);
    } else {
      simulateClick(element);
    }
  }

  async function getLinkSelectors(interactionTypes) {
    const linkSelectors = [];

    for (const t of interactionTypes) {
      validateInteractionType(t);

      const intLimit =
        t.limitInteractions !== undefined ? t.limitInteractions : Infinity;
      t.elementAttributeData = t.elementAttributeData || "";

      let allLinks = Array.from(document.querySelectorAll(t.selector));
      if (allLinks.length > intLimit) {
        allLinks = allLinks.slice(0, intLimit);
      }

      for (const link of allLinks) {
        const querySelector = generateQuerySelector(link);
        if (querySelector) {
          linkSelectors.push({
            selector: querySelector,
            targetedElementsType: t.targetedElementsType,
            elementAttributeData: t.elementAttributeData,
          });
        } else {
          console.warn("Failure collecting CSS selector for:", link);
        }
      }
    }

    return linkSelectors;
  }

  function getOpDataParam(url) {
    const params = new URL(url).searchParams;
    const opData = params.get("opClickAllData");
    return opData ? JSON.parse(decodeURIComponent(opData)) : null;
  }

  /**
   * Colors the specified element to indicate interaction.
   * @param {Element} element - The DOM element to color.
   * @param {Object} interactionObject - The interaction details.
   */
  function colorElement(element, interactionObject) {
    let currentElement = element;
    let iteration = 0;
    const maxIterations = 10;

    while (currentElement && iteration < maxIterations) {
      if (isElementInViewport(currentElement)) {
        Object.assign(currentElement.style, {
          color: "black",
          backgroundColor: "#f2cd14",
          border: "2px solid #333",
          opacity: "1",
        });
        return;
      }
      currentElement = currentElement.parentElement;
      iteration++;
    }

    // If element not visible after traversing up
    displayNotification(interactionObject);
  }

  /**
   * Checks if the specified element is within the viewport.
   * @param {Element} element - The DOM element to check.
   * @returns {boolean} - True if the element is in the viewport, false otherwise.
   */
  function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0;
  }

  /**
   * Displays a notification if the element is not visible.
   * @param {Object} interactionObject - The interaction details.
   */
  function displayNotification(interactionObject) {
    const notificationElement = document.createElement("div");
    notificationElement.textContent = `Element not visible, but was successfully clicked.
        
Element Selector: ${interactionObject["Element Selector"].trim()}

Element Inner Text: ${
      interactionObject["Element Inner Text"]
        ? interactionObject["Element Inner Text"].trim()
        : "N/A"
    }

href: ${interactionObject["href"] ? interactionObject["href"].trim() : "N/A"}`;

    Object.assign(notificationElement.style, {
      position: "fixed",
      whiteSpace: "pre-wrap",
      top: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: "60%",
      padding: "10px",
      backgroundColor: "#f2cd14",
      color: "black",
      border: "2px solid #333",
      textAlign: "center",
      zIndex: "9999",
    });

    document.body.appendChild(notificationElement);
  }

  /**
   * Adds links to the page based on the provided link selectors.
   * @param {Array} linkSelectors - The array of link selector objects.
   */
  function addLinksToPage(linkSelectors) {
    const fragment = document.createDocumentFragment();

    linkSelectors.forEach((ls) => {
      const newLink = document.createElement("a");
      const payload = {
        targetedElementsType: ls.targetedElementsType,
        interactedElement: ls.selector,
      };
      if (ls.elementAttributeData) {
        payload["elementAttributeData"] = ls.elementAttributeData;
      }
      const newURL = getNewURL(window.location, payload);
      newLink.href = newURL;
      fragment.appendChild(newLink);
    });

    document.body.appendChild(fragment);
  }

  /**
   * Constructs a new URL with the provided payload.
   * @param {Location} location - The current window location.
   * @param {Object} payload - The payload to include in the URL.
   * @returns {string} - The new URL string.
   */
  function getNewURL(location, payload) {
    const url = new URL(location.href);
    url.searchParams.set(
      "opClickAllData",
      encodeURIComponent(JSON.stringify(payload))
    );
    return url.toString();
  }

  /**
   * Validates the interaction type configuration.
   * @param {Object} type - The interaction type object to validate.
   */
  function validateInteractionType(type) {
    if (typeof type.selector !== "string" || !type.selector) {
      throw new Error(
        `Invalid selector in INTERACTION_TYPES: ${type.selector}`
      );
    }
    if (
      typeof type.targetedElementsType !== "string" ||
      !type.targetedElementsType
    ) {
      throw new Error(
        `Invalid targetedElementsType in INTERACTION_TYPES: ${type.targetedElementsType}`
      );
    }
  }
})();
