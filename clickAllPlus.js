/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////USER CONFIGURATION////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Include filter must include the following after the domain: .*opClickAllData.*
//ex. https://example.com.*opClickAllData.*
//add two new Data Layer objects within the sub-folder: interactionObject,interactionValidation

const INTERACTION_TYPES = [{
    'selector': 'test',
    'targetedElementsType': 'test',
    'limitInteractions' : -1, //set max number of elements to interact with; leave as -1 to interact with all that apply
    'elementAttributeData': 'test,test', //leave blank if not applicable
    'action': function(element) { //function that will perform action on elements found; if no 'action' sepcified in configuration (removing this action attribute), defaults to a click simulation
        simulateClick(element);
    },
}];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//version 2.0
var interactionValidation = {},
    interactionObject = {
        'Element Selector': ''
    };
async function main() {
    let par = getURLParameters(window.location.href)
    if (par['opClickAllData']) {
        let allData = JSON.parse(par['opClickAllData']);
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
            var queryExists = (!/\?/.test(window.location.href)) ? '?' : '&';
            var payload = {
                'targetedElementsType': ls.targetedElementsType,
                'interactedElement': ls.selector
            }
            if (ls.elementAttributeData !== '') payload['elementAttributeData'] = ls.elementAttributeData;
            newLink.href = `${window.location.href}${queryExists}opClickAllData=${encodeURIComponent(JSON.stringify(payload))}`;
            console.log(newLink.href);
            console.log(document.querySelector(ls.selector));
            document.body.appendChild(newLink);
        })
        console.log(`${linkSelectors.length} links found on page matching configuration`)
    }
}
main();

function performAction(element, targetedElementsType) {
    let targetedElementsTypeObjs = INTERACTION_TYPES.filter(l => {
        return l.targetedElementsType === targetedElementsType
    });
    if (targetedElementsTypeObjs.length === 0) return 'No configuration for targetedElementsType';
    if (targetedElementsTypeObjs[0].action && typeof targetedElementsTypeObjs[0].action === 'function') {
        targetedElementsTypeObjs[0].action(element);
    } else {
        simulateClick(element);
    }
}

async function getLinkSelectors(INTERACTION_TYPES) {
    let linkSelectors = new Array();
    for (const t of INTERACTION_TYPES) {
        let intLimit = (t.limitInteractions) ? t.limitInteractions : -1;
        console.log(`int limit ${intLimit}`)
        if (!t.elementAttributeData) t.elementAttributeData = '';
        let allLinks = [...document.querySelectorAll(t.selector)];
        if (intLimit !== -1 && allLinks.length > intLimit){
            allLinks = allLinks.slice(0, intLimit)
        }
        let selectors = allLinks.map(link => {
            let querySelector = generateQuerySelector(link);
            if (querySelector !== -1){
                let selectorSplit = querySelector.replaceAll(/\s/g, '').split('#');
                if (selectorSplit.length === 1) {
                    return {
                        'selector': selectorSplit[0],
                        'targetedElementsType': t.targetedElementsType,
                        'elementAttributeData': t.elementAttributeData
                    }
                } else {
                    return {
                        'selector': `#${selectorSplit[selectorSplit.length -1]}`.replace(/#(.*?)(?=[.>])/, '[id="$1"]').replace(/#(\d+)/, '[id="$1"]'),
                        'targetedElementsType': t.targetedElementsType,
                        'elementAttributeData': t.elementAttributeData
                    }
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
    let querylength = 0;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE && querylength !== 1) {
        let selector = currentElement.nodeName.toLowerCase();
        if (currentElement.id) {
            selector = `#${currentElement.id}`;
            selectorParts.unshift(selector);
            break;
        } else {
            let classes = Array.from(currentElement.classList).map(className => (!/[#:]/.test(className) && !/\d+/.test(className)) ? `.${className}` : '').join('');
            selector += classes;

            if (currentElement.parentElement) {
                const siblings = Array.from(currentElement.parentElement.children);
                const index = siblings.indexOf(currentElement) + 1;
                if (index > 1) {
                    selector += `:nth-child(${index})`;
                }
            }
        }
        selectorParts.unshift(selector);
        currentElement = currentElement.parentElement;
        try{
            querylength = document.querySelectorAll(selectorParts.join('>')).length;
        }
        catch(e) {
            return -1
        }
    }
    return selectorParts.join('>')
}

function getURLParameters(url) {
    var params = {};
    var queryString = url.split('?')[1];
    if (queryString) {
        var pairs = queryString.split('&');
        pairs.forEach(function(pair) {
            var keyValue = pair.split('=');
            var key = decodeURIComponent(keyValue[0]);
            var value = decodeURIComponent(keyValue[1]);
            params[key] = value;
        });
    }
    return params;
}

function simulateClick(element) {
    element.scrollIntoView();
    var clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(clickEvent);
}

async function colorElement(element, iteration, interactionObject) {
    const isVisible = await isElementInViewport(element);
    if (isVisible) {
        element.style.color = 'black';
        element.style.backgroundColor = '#f2cd14';
        element.style.border = '2px solid #333';
        element.style.opacity = 100;
    } else if (iteration === 2) {
        let notificationElement = document.createElement('div'); //TODO {... notation change}
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
        });

        observer.observe(element);
    });
}