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
"Now, let me walk you through the actual LANES application.

*(Demo Steps)*
1. **Landing Page:** When a user opens LANES, they first see the Landing Page. Here, they can immediately enter a location, view our color-coded flood severity guide, and check real-time weather conditions.
2. **Community Feed:** Next is the Feed Page. This acts as our social community hub where commuters can view real-time flood reports from others and stay updated on the situation.
3. **Interactive Map & Routing:** On the Map Page, the user has two tools. In the left panel, the routing engine lets them input their destination and vehicle type to get a safe route. If they encounter a flood, they can open the reporting panel, pinpoint their exact location, and answer a quick survey to report it.
4. **DRRM Admin Dashboard:** Finally, those submitted reports go straight to our Admin Panel. Here, local disaster officers review the incoming data. Once validated and approved, the system instantly updates the map for everyone, and Valhalla automatically calculates safe detours around the newly marked flood zones.

That covers the core concept and flow of LANES. Thank you!"
