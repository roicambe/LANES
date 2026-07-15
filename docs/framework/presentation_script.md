# LANES Presentation Script

**Speaker:** (You)
**Topics:** Conceptual Framework, System Demonstration

---

## Part 1: Conceptual Framework (System Architecture)
"Good Day! I'll be presenting the Conceptual Framework and System Demonstration for LANES. 

Our system operates on a Horizontal 3-Tier Software Architecture:

1. **Presentation Tier (The Interface):** This contains two main portals. First, the **PWA Commuter Client**, where users view the live map and submit direct flood reports. Second, the **DRRM Administrative Dashboard**, a secure web portal where local disaster officers manually review, validate, and approve those incoming flood reports before they go live to the public.
2. **Application Logic Tier (The Brains):** This handles our complex processing. Our Automated Stream Scrapers pull public social media posts, passing them to the **Bilingual NLP Parser**. This AI extracts street names and flood depths from raw Taglish text. Finally, we use the **Valhalla Routing Engine**, an open-source router that dynamically calculates safe detours.
3. **Data Persistence Tier (The Storage):** We use **PostgreSQL with PostGIS** to store our spatial data. When the DRRM approves a report, the **OSM Geocoder** () converts it into exact coordinates and generates a 50-meter safety polygon. This polygon is instantly fed back to Valhalla as an 'active avoidance zone' so the system knows exactly which roads to block."

## Part 2: System Demonstration
"Now, let me show you how our system works in real-time. 

*(Demo Steps)*
1. **Reporting & Scraping:** First, let's look at a raw text report coming in, for example: 'Baha sa Caruncho Ave, lagpas tuhod na' (Flood in Caruncho Ave, over the knee). This can either be scraped by the AI or submitted directly by a user.
2. **Admin Validation:** If we look at the DRRM Dashboard, you can see the new report waiting in the Pending Validation Queue. As an admin, we will verify this. Once approved, the NLP Parser categorizes it as 'Orange' severity because it is 'over the knee', which means it is impassable for light vehicles.
3. **Map Update:** Now, let's switch to the Commuter Client. If you check our map, you will see that the flooded area on Caruncho Ave is already highlighted as a live point layer.
4. **Dynamic Rerouting:** Let's say I set a destination that passes through Caruncho. As you can see, the system will not route us there. The Valhalla Routing Engine automatically calculated a detour around the flooded road to keep the commuter safe.

That covers the core concept and flow of LANES. Thank you!"
