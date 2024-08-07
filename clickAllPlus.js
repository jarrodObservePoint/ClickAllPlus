/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////USER CONFIGURATION////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Include filter must include the following after the domain: .*opClickAllData.*
//ex. https://example.com.*opClickAllData.*
//add two new Data Layer objects within the sub-folder: interactionObject,interactionValidation

const INTERACTION_TYPES = [{
    'selector': 'test',
    'targetedElementsType': 'test',
    'limitInteractions': Infinity, //set max number of elements to interact with; leave as Infinity to interact with all that apply
    'elementAttributeData': 'test,test', //leave blank if not applicable
    'action': function(element) { //function that will perform action on elements found; if no 'action' sepcified in configuration (removing this action attribute), defaults to a click simulation
        simulateClick(element);
    },
}];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var interactionValidation = {},
    interactionObject = {
        'Element Selector': ''
    };
async function main() {
    let opClickAllData = getOpDataParam(window.location.href)
    if (opClickAllData) {
        let allData = opClickAllData;
        let selector = allData['interactedElement'];
        interactionObject['Element Selector'] = selector;
        let interactionElement = document.querySelector(selector);
        if (interactionElement) {
            interactionObject['Element Inner Text'] = interactionElement.innerText;
            if (interactionElement.href) interactionObject['href'] = interactionElement.href;
            if (allData['elementAttributeData'] !== undefined) {
                let datas = allData['elementAttributeData'].split(',');
                datas.forEach(d => {
                    interactionValidation[d] = (interactionElement.getAttribute(d)) ? interactionElement.getAttribute(d) : 'DATA ELEMENT MISSING';
                })
            }
            if (interactionElement.hasAttribute('target') && interactionElement.getAttribute('target') === '_blank') interactionElement.setAttribute('target', '_self');
            performAction(interactionElement, allData['targetedElementsType']);
            colorElement(interactionElement, 1, interactionObject);
            console.log(interactionElement)
        } else {
            interactionObject = {
                'Element Selector': 'ELEMENT NO LONGER AVAILABLE'
            }
        }
    } else {
        let linkSelectors = await getLinkSelectors(INTERACTION_TYPES);
        linkSelectors.forEach(ls => {
            var newLink = document.createElement('a');
            var payload = {
                'targetedElementsType': ls.targetedElementsType,
                'interactedElement': ls.selector
            }
            if (ls.elementAttributeData !== '') payload['elementAttributeData'] = ls.elementAttributeData;
            let newURL = getNewURL(window.location, payload);
            newLink.href = newURL;
            console.log(newLink.href);
            console.log(document.querySelector(ls.selector));
            document.body.appendChild(newLink);
        })
        console.log(`${linkSelectors.length} links found on page matching configuration`)
    }

    function getNewURL(location, payload) {
        const baseUrl = `${location.protocol}//${location.hostname}${location.pathname}`;
        const params = {
            ...Object.fromEntries(new URLSearchParams(location.search)),
            opClickAllData: encodeURIComponent(JSON.stringify(payload))
        };
        const queryString = new URLSearchParams(params).toString();
        return `${baseUrl}?${queryString}${location.hash}`;
    }
}
main();

function performAction(element, targetedElementsType) {
    let targetedElementsTypeObjs = INTERACTION_TYPES.filter(l => {
        return l.targetedElementsType === targetedElementsType
    });
    if (targetedElementsTypeObjs.length === 0) return console.log('No configuration for targetedElementsType')
    if (targetedElementsTypeObjs[0].action && typeof targetedElementsTypeObjs[0].action === 'function') {
        targetedElementsTypeObjs[0].action(element);
    } else {
        simulateClick(element);
    }
}

async function getLinkSelectors(INTERACTION_TYPES) {
    let linkSelectors = new Array();
    for (const t of INTERACTION_TYPES) {
        let intLimit = (t.limitInteractions) ? t.limitInteractions : Infinity;
        if (!t.elementAttributeData) t.elementAttributeData = '';
        let allLinks = [...document.querySelectorAll(t.selector)];
        if (allLinks.length > intLimit) {
            allLinks = allLinks.slice(0, intLimit)
        }
        let selectors = allLinks.map(link => {
            let querySelector = generateQuerySelector(link);
            if (querySelector !== -1) {
				return {
					'selector': querySelector,
					'targetedElementsType': t.targetedElementsType,
					'elementAttributeData': t.elementAttributeData
				}
            } else {
                console.log(`Failure collecting CSS selector for: ${link}`)
            }
        });
        selectors.forEach(s => {
            linkSelectors.push(s)
        });
    };
    return linkSelectors
}

function generateQuerySelector(element) {
    const selectorParts = [];
    let currentElement = element;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        let selector = currentElement.nodeName.toLowerCase();

        if (currentElement.id && !uuidCheck(currentElement.id)) {
            selector = `[id="${currentElement.id}"]`;
        } else {
            const classes = Array.from(currentElement.classList)
                .filter(classCheck)
                .map(className => `.${className}`)
                .join('');
            selector += classes;

            if (currentElement.parentElement) {
                const siblings = Array.from(currentElement.parentElement.children);
                const sameTagSiblings = siblings.filter(sibling => sibling.nodeName.toLowerCase() === selector.split('.')[0]);
                if (sameTagSiblings.length > 1) {
                    const index = sameTagSiblings.indexOf(currentElement) + 1;
                    selector += `:nth-child(${index})`;
                }
            }
        }

        selectorParts.unshift(selector);

        const query = selectorParts.join('>');
        try {
            if (document.querySelectorAll(query).length === 1) {
                break;
            }
        } catch (e) {
            return -1;
        }

        currentElement = currentElement.parentElement;
    }

    return selectorParts.join('>');

    function classCheck(className) {
        // Class cannot contain special characters or be a UUID
        return !/[#:]/.test(className) && !/\d+/.test(className);
    }

    function uuidCheck(s) {
        // Check if selector attribute contains a UUID
        const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
        return uuidPattern.test(s);
    }
}


function getOpDataParam(url_string) {
    let opData = new URL(url_string).searchParams.get("opClickAllData");
    return (opData) ? JSON.parse(decodeURIComponent(opData)) : null;
}

function simulateClick(element) {
    var mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(mouseDownEvent);

    setTimeout(function() {
        var mouseUpEvent = new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(mouseUpEvent);

        // Click event
        var clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(clickEvent);
    }, 100);
}

async function returnRelevantParent (element,parentSelector) {
	let checkElement = element;
	while (checkElement.parentElement) {
		checkElement = checkElement.parentElement;
		let matchesParent = checkElement.matches(parentSelector);
		if (matchesParent) {
            return checkElement
		} else if (checkElement.nodeName === 'HTML') {
            return null
        }
	} 
}

async function colorElement(element, iteration, interactionObject) {
    const isVisible = await isElementInViewport(element);
    if (isVisible) {
        element.style.color = 'black';
        element.style.backgroundColor = '#f2cd14';
        element.style.border = '2px solid #333';
        element.style.opacity = 100;
    } else if (iteration === 2) {
        let notificationElement = document.createElement('div');
        notificationElement.textContent = `Element not visible, but was successfully clicked\r\n\r\nIts selector is ${interactionObject['Element Selector'].trim()}\r\n\r\nIts innertext is ${interactionObject['Element Inner Text'].trim()}\r\n\r\nIts href is ${interactionObject['href'].trim()}`;
        notificationElement.style.position = 'fixed';
        notificationElement.style['white-space'] = 'break-spaces';
        notificationElement.style['overflow-wrap'] = 'break-word';
        notificationElement.style.top = '0';
        notificationElement.style.left = '50%';
        notificationElement.style.transform = 'translateX(-50%)';
        notificationElement.style.width = '60%';
        notificationElement.style.padding = '10px';
        notificationElement.style.backgroundColor = '#f2cd14';
        notificationElement.style.color = 'black';
        notificationElement.style.border = '2px solid #333';
        notificationElement.style.textAlign = 'center';
        notificationElement.style.zIndex = '9999';
        document.body.appendChild(notificationElement);
    } else {
        iteration++;
        colorElement(element.parentElement, iteration, interactionObject)
    }
}

async function isElementInViewport(element) {
    return await new Promise(resolve => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                resolve(entry.isIntersecting);
            });
            observer.unobserve(element);
        });
        observer.observe(element);
    });
}
