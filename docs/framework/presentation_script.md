# LANES Presentation Script

**Speaker:** (You)
**Topics:** Concept of the Study, Conceptual Framework, System Demonstration

---

## Part 1: Concept of the Study
"Good morning, everyone! To start our presentation, I will discuss the concept behind our study, LANES, which stands for Localised Alternative Navigation for Environs under Submersion. 

As we all know, Pasig City often experiences flooding during heavy rains and typhoons. There are many navigation apps available today, like Waze or Google Maps, but they focus mainly on traffic. When there is a flood, they only show static map markers and do not automatically redirect users when roads become impassable.

At the same time, we noticed that flood reports are scattered across social media. These reports are usually written in casual Taglish, for example, 'Baha sa Caruncho, lagpas tuhod' which means 'Flood in Caruncho, over the knee.' Because of this, we decided to create a platform that can extract information from these unstructured public posts using Natural Language Processing (NLP) and Named Entity Recognition (NER). 

Instead of using expensive hardware sensors, we use software to turn these Taglish flood reports into useful map data. Basically, whether a commuter submits a report directly through our app or the AI scrapes it from social media, our system processes it, the DRRM validates it, and then it automatically creates a safe detour for commuters so they can avoid the flooded areas."

## Part 2: Conceptual Framework (System Architecture)
"Moving on to our Conceptual Framework, our system uses a Horizontal 3-Tier Software Architecture. 

1. **Presentation Tier:** This is what our users see and interact with. We have the PWA Commuter Client for the commuters, which uses MapLibre GL JS to show the live map and allows them to submit direct flood reports. We also have the DRRM Administrative Dashboard where officers can check and approve the incoming flood reports.
2. **Application Logic Tier:** This is the brain of LANES. We have Automated Stream Scrapers that collect raw text reports. These reports then go to our Bilingual NLP Parser. Here, we extract the street names and the flood levels from English and Tagalog text. After that, we use the Valhalla Routing Engine to calculate the new detour.
3. **Data Persistence Tier:** This is where we store our map data using PostgreSQL with PostGIS. Once a report is verified, the OSM Geocoder turns it into map coordinates and creates a 50-meter safety zone around the flooded area. This zone is then sent to Valhalla as an 'active avoidance polygon,' so the system knows to avoid that road."

## Part 3: System Demonstration
"Now, let me show you how our system works in real-time. 

*(Demo Steps)*
1. **Reporting & Scraping:** First, let's look at a raw text report coming in, for example: 'Baha sa Caruncho Ave, lagpas tuhod na' (Flood in Caruncho Ave, over the knee). This can either be scraped by the AI or submitted directly by a user.
2. **Admin Validation:** If we look at the DRRM Dashboard, you can see the new report waiting in the Pending Validation Queue. As an admin, we will verify this. Once approved, the NLP Parser categorizes it as 'Orange' severity because it is 'over the knee', which means it is impassable for light vehicles.
3. **Map Update:** Now, let's switch to the Commuter Client. If you check our map, you will see that the flooded area on Caruncho Ave is already highlighted as a live point layer.
4. **Dynamic Rerouting:** Let's say I set a destination that passes through Caruncho. As you can see, the system will not route us there. The Valhalla Routing Engine automatically calculated a detour around the flooded road to keep the commuter safe.

That covers the core concept and flow of LANES. Thank you!"
