# LANES Capstone Defense Q&A and Suggestions

This document contains potential questions from various defense panelists and target users, complete with answers directly sourced from your documentation. It also provides specific suggestions for improving the documentation where gaps or inconsistencies exist.

---

## 🎙️ Part 1: Potential Panelist Questions & Answers

### 👨‍🏫 Panelist 1: The IT Professor / Doctorate (Focus: Methodology & Research Justification)

**Q1: Why did you choose to use Natural Language Processing (NLP) over physical IoT water sensors, considering sensors are highly accurate?**
* **Answer:** While IoT sensors like ultrasonic arrays are highly accurate (as proven by Abana et al., 2019 and FLONAV), they present substantial financial and scalability constraints for a local government unit like Pasig City. NLP allows us to bypass physical hardware costs by mining existing public textual data and transforming it into spatial intelligence, matching routing performance at a significantly lower operational cost.
* *(Source: 1.2 Review of Related Literature - Flood Evacuation Routing and Spatial Network Modeling)*

**Q2: How did you determine the size of your training dataset for the NER model, and why is that number sufficient?**
* **Answer:** We targeted 300 to 500 annotated text samples. Because our model needs to recognize multiple entity types (street names, landmarks) across a bilingual Taglish format, a smaller dataset (like 50-100) would lack the necessary variation, resulting in low precision and recall. 
* *(Source: 2.2.2 Algorithm - Bilingual Named Entity Recognition and Severity Mapping)*

**Q3: How are you evaluating the success and quality of your platform?**
* **Answer:** We are using a dual-evaluation approach. For the NLP extraction, we use standard ML metrics (Precision, Recall, F1-Score). For the software platform itself, we use the ISO/IEC 25010 Software Product Quality Model, specifically testing Functional Suitability, Performance Efficiency, Usability (using the System Usability Scale), and Reliability via user assessment questionnaires with commuters, DRRM personnel, and IT experts.
* *(Source: 2.2 Research Design)*

---

### 💻 Panelist 2: The Software Engineer / Full Stack Developer (Focus: Architecture)

**Q4: Can you explain why you chose a decoupled 3-tier architecture instead of a traditional monolithic MVC application?**
* **Answer:** The decoupled architecture isolates our client-side map rendering (Next.js/MapLibre) from the highly resource-intensive background tasks. By separating the Presentation tier from the Application Logic tier (FastAPI/Valhalla), the server can dedicate its processing power to NLP tokenization and spatial routing calculations without bogging down the user interface.
* *(Source: DESIGN.md - 1. High-Level Architecture & 2.2.1 Architectural Framework)*

**Q5: During a severe typhoon, many users will be submitting and validating reports. How do you ensure the frontend maps update in real-time without the user needing to refresh the page?**
* **Answer:** We implemented a native WebSocket connection between our React frontend and FastAPI backend. When the DRRM admin approves a report, the backend broadcasts a WebSocket event. The frontend intercepts this, invalidates the TanStack React Query cache, and triggers a silent background refetch of the map layers.
* *(Source: Feature Reference - 5. Real-Time Event Signaling)*

---

### 🗄️ Panelist 3: The API / Database Specialist (Focus: Data Integrity & Routing Logic)

**Q6: Your system accepts highly variable and unstructured text data. How do you maintain database normalization under these conditions?**
* **Answer:** We strictly enforce Third Normal Form (3NF). Unstructured text is parsed and separated into structured relational tables (e.g., `flood_reports` for the text, `flood_avoidance_zones` for the spatial polygon). For highly variable scraper metadata, we utilize PostgreSQL's native `JSONB` columns to maintain structural flexibility without violating relational constraints.
* *(Source: DESIGN.md - 2. Core Database Schema & Relations)*

**Q7: Exactly how does the system turn a text report into a blocked road on the map? Explain the algorithmic flow.**
* **Answer:** First, the NER model extracts the street name and severity. Second, the OSM Geocoder converts the street name to a Lat/Long coordinate. Third, upon admin approval, PostGIS uses `ST_Buffer` to draw a 50-meter polygon around that coordinate. Finally, the routing engine (Valhalla) intersects the commuter's path with that polygon and dynamically updates the road's cost matrix (edge weight) to Infinity (∞), forcing a detour.
* *(Source: 2.2.2 Algorithm - Graph Network Routing and Cost Matrix Optimization)*

**Q8: How do you secure administrative access and ensure passwords are safe?**
* **Answer:** We do not store plaintext passwords; they are hashed using the **bcrypt** algorithm with an adaptive salt. For session security, we issue signed JSON Web Tokens (JWT) via `python-jose`. FastAPI routes intercept these tokens to validate signatures and enforce Role-Based Access Control (RBAC) before granting admin privileges.
* *(Source: DESIGN.md - 6. Security & Access Architecture)*

---

### 🎨 Panelist 4: The Graphic Designer / UI-UX Expert (Focus: Usability)

**Q9: Disaster applications are often used during highly stressful situations. What was your design philosophy to ensure the app is usable during an emergency?**
* **Answer:** We utilized an "Illustrated Minimalist Spatial System" philosophy. The map is the primary source of truth, and we explicitly avoid decorative elements or heavy animations that cause visual noise. The interface is distraction-free, ensuring every screen can be read within 3 seconds, focusing entirely on "Clarity Under Stress."
* *(Source: DESIGN.md - 4. UI Philosophy: Illustrated Minimalist Spatial System)*

**Q10: How do you visually communicate the danger level of a flooded street to a commuter who is driving?**
* **Answer:** We translate depth phrases into a standardized four-tier visual map overlay: White (passable/ankle-deep), Yellow (moderate/knee-deep), Orange (high/waist-deep), and Red (extreme/submerged). This immediate color-coding allows users to instantly gauge risk without reading text.
* *(Source: 1.5 Scope and Limitation of the Study)*

---

### 🚶‍♂️ Panelist 5: The Regular Person / Commuter (Focus: Practical Usage)

**Q11: Do I need to download this app from the Apple App Store or Google Play Store to use it during a storm?**
* **Answer:** No, you don't need to visit an app store. LANES is built as a Progressive Web Application (PWA). You can access it instantly via your web browser, which saves phone storage, uses less data, and allows us to push critical updates immediately without waiting for app store approvals.
* *(Source: 1.5 Scope and Limitation of the Study - Cross-Platform Delivery & Feature Reference - 7. Offline Resiliency & PWA Capabilities)*

**Q12: What happens if someone submits a fake flood report as a prank? Will it ruin my route?**
* **Answer:** No, it will not affect your route. The system has a built-in safety measure: the Admin Moderation Queue. All incoming reports are held in a pending status. They are not broadcast to the public map, and they do not affect the routing engine, until a verified DRRM administrator reviews and explicitly clicks "Approve."
* *(Source: 2.2.2 Algorithm - Spatial Geocoding and PostGIS Geometric Buffering & Feature Reference - 4. Queue-Based Admin Moderation)*

---

### 🚨 Panelist 6: The DRRMO Chief / Head of Disaster Risk Reduction (Focus: Civic Integration & Management)

**Q13: My team is already overwhelmed during a typhoon. How does this system make our job easier instead of giving us more work?**
* **Answer:** Currently, your team has to manually sift through thousands of informal "Taglish" social media posts to figure out where the floods are. LANES automates the hardest part. The NLP engine instantly reads the text, extracts the exact street name, and calculates the severity for you. It lines them up in a clean dashboard, so all your team has to do is verify and click "Approve" to instantly update the map for the entire city, drastically streamlining your municipal resource deployment.
* *(Source: 1.3 Significance of the Study - The City of Pasig and Local DRRM Units)*

**Q14: For accountability, can we track the history of approved reports and see which of my officers made map changes?**
* **Answer:** Yes, absolute transparency is built into the system. Every time an officer approves a report, rejects a submission, or deactivates a hazard zone, the action is securely recorded in the `audit_logs` database table. This provides a full historical ledger of who did what and when, ensuring complete administrative accountability.
* *(Source: DESIGN.md - 9. Audit Logging & Moderation Logs)*

---

## 📝 Part 2: Suggestions for Documentation Improvement

While analyzing your documentation, a few gaps and inconsistencies were found. Since a Q&A requires solid backing from the text, you should revise your documentation to address these issues:

1. **Incomplete Agile Lifecycle (Missing Phases 3 to 5):**
   * **The Hole:** In Section 2.2.3, you introduced the Agile SE Paradigm and listed "1. Requirements Planning and Analysis" and "2. System and Architecture Design", but the text cuts off there.
   * **Suggestion:** You must complete this section in your actual document. Add steps for:
     * *3. Implementation / Sprint Execution* (Coding the NLP model and backend).
     * *4. Testing & Validation* (Evaluating ISO 25010 metrics).
     * *5. Deployment & Review* (Releasing the PWA).

2. **Inconsistency Regarding Audit Logs:**
   * **The Hole:** In `DESIGN.md` (Section 9), it states the `audit_logs` table is *"planned and not yet implemented"*. However, in `database-design-plan.md` and the `Feature Reference`, the Audit Trail is listed as a fully integrated feature. 
   * **Suggestion:** A panelist might ask, *"Is your audit logging actually working or just a plan?"* You need to update `DESIGN.md` to remove the "planned" warning if it has already been coded, ensuring consistency across all files.

3. **Missing Explanations for Cloudinary & Brevo in Chapter 2:**
   * **The Hole:** Your `tech-stack.md` and `feature-reference.md` mention using Cloudinary for images and Brevo for OTP emails. However, the architectural flow in Chapter 2.2.1 doesn't mention how these external APIs interact with your 3-Tier Architecture.
   * **Suggestion:** Briefly add a sentence in the *Application Logic Tier* paragraph (Section 2.2.1) explaining that external CDN services (Cloudinary) and SMTP APIs (Brevo) are utilized to offload heavy image processing and email dispatches.

4. **Missing Content Up to Section 2.7:**
   * **The Hole:** Your instructions requested a reviewer up to "CHAPTER 2, 2.7 Summary", but the provided `LANES_documentation.md` only goes up to Section 2.2.3.
   * **Suggestion:** Ensure your final printed manuscript actually contains Sections 2.3 to 2.7. If panelists flip to those pages, the methodology details (like Data Gathering Procedures, Respondents, etc.) must match the high-level descriptions provided in the Agile and ISO 25010 sections.
