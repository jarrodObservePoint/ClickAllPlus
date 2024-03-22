# ClickAll Plus Solution


## Introduction

ObservePoint aims to validate marketing and analytics data on pages. ObservePoint has two methods to accomplish this: audits and journeys. Up to this point, ObservePoint has leveraged audits for massive validation on mainly pageload event calls, where journeys have been leveraged to build targeted actions through a user flow of the site, enabling event action of marketing, analytics, and privacy data validation.


## Problem

Journeys can validate action events, but are linear and can only validate a very targeted user journey through the site. It is unscalable to create a journey or group of journeys that interact with everything on every page.

Audits are far more scalable, but they unfortunately are difficult to perform groupings of actions on every page. Up to this point, ObservePoint’s solutions to “click all” elements on the page involves simply gathering all elements on an on-page action and interacting with them (mainly clicking) them. 

The issue with this method is that there is no way to then tie the one-to-many relationship of page to interactions, in relation to the tags and cookies set from specific interactions (i.e. clicking on all links on the page, there isn’t a way to then tie a specific tag back to a specific link click on the page. The tag would be mixed with all other tags that fired from clicking on all links)


## Solution

[LINK TO CODE](https://github.com/jarrodObservePoint/ClickAllPlus/blob/main/clickAllPlus.js)

The link above is the current version of code that can be run within an audit to accomplish the task of interacting with with all desired elements on a specified set of pages. The code is designed to have minimal setup by the user.

The code has comments that should be reviewed as it is implemented.

NOTE: The only portion of the code that you need to edit/configure is between the block of comments labeled USER CONFIGURATION. Edits below that should be done by those technical enough to understand its purpose and/or after consulting with Solution Architects or Product team members at ObservePoint.


### Steps to Implement



1. Download/copy the code from the above repository
2. Within the code, there is a section of code between comment blocks that is labeled USER CONFIGURATION.
    1. This will be the only area of the code you should need to make changes to.
3. The main portion of configuration needed by the user is the LINK_TYPES array of objects:
    2. Each object has three (3) attributes. Two (2) are required and one (1) is not.
        1. Required:
            1. selector
                1. This is a CSS selector that will return back an array of all elements that match that CSS across the pages where this will run
                2. The best way to get this CSS Selector and determine the elements that will be interacted with is to go to a page you intend to perform this solution on and open dev tool (F12 or right-clicking and clicking “Inspect”)
                3. Once there, you can see tabs for “elements” and “console”
                4. Elements are the list of elements on the document and ultimately the way to see the best selectors for the next step.
                5. Console will allow you to run a small piece of JavaScript to help you know which elements you are going to have interacted with
                6. That small piece of JavaScript is well documented in [this help document](https://www.w3schools.com/jsref/met_document_queryselectorall.asp)
                    1. The array of elements that return from doing a “document.querySelectorAll()” with your CSS selector is ultimately what will be interacted with. That CSS selector you pass into querySelectorAll will be what you give to the selector attribute of this object
            2. targetedElementsType
                7. This is simply a label to identify within the code and later in the results of the audit the “category” or “type” of thing that was interacted with
                    2. E.g. download links, header links, external links, etc. 
                8. This value must have **_no spaces_**
        2. Not Required 
            3. limitInteractions
                9. This allows you to specify the max number of configured elements you’d like to interact with
                    3. E.g. a page has 10 CTA buttons, but I only need to validate one of them, you’d put a 10; if I want to test all 10, put -1 as the value or just remove the attribute entirely from the object
                10. For situations where this is not relevant
                    4. You can leave the attribute -1 or remove the attribute entirely from the object
            4. elementAttributeData
                11. For some technologies you might be testing, there may be a desire to pull in attributes and their corresponding values to validate later with the results of the audit
                    5. E.g. data-gtm
                12. This is usually seen in those using Google Analytics validation, but can be used for any suite of technologies/data layers
                13. This value is a comma separated value
                14. Simply put the name of the attributes you’d like to validate in this field
                15. The results once the audit runs will show up in a “data layer” tag called interactionValidation
                    6. If that attribute is not available in the element that was interacted with, the solution will pass a value of DATA ELEMENT MISSING to that, meaning that the element that was interacted with didn’t have that attribute
                16. For situations where this is not relevant
                    7. You can leave the attribute an empty string or remove the attribute entirely from the object
            5. action
                17. There are many situations where you want to perform small “actions” that are not just clicking on the selected elements. In these cases, you can put a function, whose argument is the element in question, to interact with the intended elements on the page
                    8. E.g. I want to click on a header link in order to see a link to a sub-header; or I want to add a quantity before hitting an add-to-cart button
                18. For situations where this is not relevant
                    9. You can remove the attribute entirely from the object; doing so will default to a “click” event on all specified elements
    3. This is an array of objects, so you can create as many of these as you’d like. Every page that is configured in the audit will then interact with all matching CSS selectors passed in.
4. Now is time to build your audit and apply the code you’ve configured above
5. In [https://app.observepoint.com](https://app.observepoint.com) you can now create a new audit.
    4. On the first tab, name your audit and put it in a folder/subfolder appropriately
    5. Paste all URLs you’d like this solution applied to
    6. Put a limit that you’d like to have for this. The solution will interact with all elements it finds _up to_ that limit (to prevent excessive usage)
    7. Scroll down to “Additional Setup Options”
    8. You will see a section for “WHICH SECTIONS OF THE WEBSITE SHOULD BE
    9.  INCLUDED?
        3. If you’ve pasted your URLs you want tested, you should see a list of domains in this list with regex statements around them
        4. You **_MUST _**add the following to each domain:
            6. .*opClickAllData.*
            7. Here is an example:
                19. If I put [https://example.com/home](https://example.com/home) in my starting URLs
                20. In the includes list you will see something like:
                    10. ^https?://([^/:\?]*\.)?example.com([^.]|$)
                21. This **_must _**be changed to:
                    11. ^https?://([^/:\?]*\.)?example.com.*opClickAllData.*
                22. WARNING: Failure to do this change will result in potential massive usage in this audit as the audit will begin to crawl AND click elements on pages.
6. Take the code you’ve configured above, with your USER CONFIGURATION completed, and paste it in an “On-page Action” of the audit you’re audit under a new “Execute Javascript” action
    10. It is _highly_ recommended to select “prevent navigation” for this configuration
7. This step needs to only be done the first time an audit is added to a subfolder:
    11. Once the audit is saved and created, go back to your Data Sources in your account and click the Sort & Group on the top left, making sure you have Folder & Sub-Folder selected
        5. Find the folder/sub-folder of the audit you just created. Edit the sub-folder and the following to you data layer configuration (the field is comma separated, so if values are already in it, make sure you add commas appropriately for a comma separated list)
            8. interactionObject,interactionValidation
8. You can now run the audit.


### Results Consumption



1. Once the audit has completed, you can now view results of all interaction actions performed on all pages
2. The audit pages are a little bit of a misnomer in this solution:
    1. Each page is a pageview as well as an interaction action of each element configured in the implementation step, on each page specified in the Starting URLs of the Audit.
3. In order to view your segments, you can search the initial URL for the linkTypes you configured in the previous step
    2. You can also look at specific pages by filtering for just the final URL search in the audit putting in the specific URL you’d like to see.
    3. 

<p id="gdcalert1" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image1.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert2">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image1.png "image_tooltip")

4. The audit will contain the pages that “collected” the interaction elements as well as the interaction pages
    4. Example: if the audit ran on 10 pages and the audit resulted in 500 pages, the audit has 490 “interaction” pages (like a link click, for example)
    5. You can filter for these pages by simply filtering urls for “opClickAllData”
5. It is highly recommended that in the configuration steps above, you break out your “interaction” segments (INTERACTION_TYPES) by the elements you want tested so that you can test specific data on those pages
    6. The reasoning for this is that you can now leverage specific rules and other data validation/standardization features in ObservePoint to check that each interaction is performing as intended
    7. Here is an example of a rule’s “if” condition that is highly recommended to be used as a template. In the example, the configuration had a “linkType” of “allLinks”
    8. 

<p id="gdcalert2" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image2.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert3">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image2.png "image_tooltip")

    9. This configuration of the rule will only apply to those elements that were intended to interacted with from  the selectors we configured for “allLinks”
        1. I.e. only apply this rule to clicking on exit links; download links; add to cart interactions; video play events
    10. The second condition leveraging the data layer element is in case the page resulted in no interactions
        2. This may because of many reasons, but ultimately means that when the page was returned to, the script wasn’t able to find that element again
        3. The condition above means that we don’t apply rules where we didn’t end up clicking on anything
    11. Once the if logic is done, you can configure you “than” logic below this in the rule:
        4. Ex. Prop 33 should be set and Evar 34 should be a value found in the data layer
6. Each page that performed an interaction will have done it’s best to “highlight” the element that got interacted with and will look like the following on the page:
    12. 

<p id="gdcalert3" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image3.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert4">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image3.png "image_tooltip")

    13. This is not perfect as some elements are extremely hard to highlight for an array of reasons like:
        5. Hidden behind another element
        6. Isn’t visible until another action is performed
        7. Is within something like a carousel where it seems like it should be visible, but is only visible at a specific moment
        8. The element is behind something like an accordion
    14. If there is strong desire to see those elements highlighted and it simply is a need to interact with elements prior, you can leverage the “action” attribute in the configuration of the INTERACTION_TYPES to perform those actions prior to interacting with your desired element
7. If nothing is visibly highlighted, there is a data layer value that is passed to help you determine which thing was clicked on
    15. If you’re on a page where this has happened, go to tags and search “data layer”
    16. You will see a data layer with an account called interactionObject
    17. 
        9. This object will contain several variable/values that can be used to determine the element
        10. The easiest way to use this is to copy the value in the “Element Selector” variable. Click on the value in its cell. This is the unique CSS selector for the element that was interacted with on
        11. Click on the button next to the link at the top to open the URL in a new tab
            1. 

<p id="gdcalert4" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image4.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert5">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image4.png "image_tooltip")

        12. Open the dev tools and go to the console
        13. Type:
            2. document.querySelector(“&lt;<paste that selector here>>”)
            3. Hit enter and that should result in the element that was interacted with. You can right click it and scroll it into view, and reveal it in the elements panel.
        14. This should be a great way to determine exactly what was interacted with on
