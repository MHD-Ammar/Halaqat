Act as a Senior Backend Developer. We are implementing the Curriculum & Reference Data Module. Current State: User, Circle, and Student modules are ready. Your Goal: Create the structure to store Reference Materials (starting with the Holy Quran) and Seed the database with the 114 Surahs.

Please follow these instructions strictly.

1. The Material/Surah Entity
   Create apps/api/src/curriculum/entities/surah.entity.ts.

Note: We are designing this to be scalable, but optimized for Quran first.

Fields:

id: Int (Primary Key - we can use the Surah Number 1-114 as ID or a separate unique ID). Recommendation: Use standard Auto-increment ID, add a column number for Surah order.

nameArabic: string (e.g., "الفاتحة").

nameEnglish: string (e.g., "Al-Fatiha").

verseCount: int (Total verses, e.g., 7).

type: Enum (QURAN, HADITH, OTHER) - Default QURAN.

Indexing: Add an index on number for fast sorting.

2. Database Seeding (Crucial)
   We need a script to populate the database with the 114 Surahs automatically.

Implementation:

Create a service CurriculumSeeder or a standalone script using nestjs-console or a simple function called in onApplicationBootstrap.

Data: I want you to include a JSON array in the code containing at least the first 5 Surahs and the last 5 Surahs as a sample, and a comment indicating where I can paste the full 114 list.

Logic: upsert the data (if Surah 1 exists, don't create it again).

3. Curriculum Controller (Read-Only)
   The teachers need to fetch this list to populate dropdowns in the App.

Endpoints:

GET /curriculum/surahs: Returns list of all Surahs sorted by number.

Cache this response if possible (or mention how to), as this data rarely changes.

4. Future-Proofing (Notes)
   In the future, we might add "Juz" or "Page" mapping. For now, verseCount is enough to validate input (e.g., User cannot enter "Verse 300" for Surah Al-Baqarah because max is 286).

Acceptance Criteria (Checklist)
[ ] The Surah table is created in the DB.

[ ] When the app starts (or via a specific command), the table is populated with Surah data.

[ ] GET /curriculum/surahs returns the JSON list of Surahs.

[ ] The structure allows adding non-Quranic material later by changing the type.

Output: Provide:

The Surah entity.

The Seeding Logic/Script (ensure it's robust).

The CurriculumController.
