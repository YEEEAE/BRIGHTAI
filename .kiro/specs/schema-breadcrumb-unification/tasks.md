# Implementation Plan: Schema and Breadcrumb Unification

## Overview

This implementation plan breaks down the Schema and Breadcrumb unification system into discrete coding tasks. The system will scan all HTML files, unify duplicate Schema into single `@graph` structures, correct breadcrumb paths for solution pages, create a Solutions Hub page if missing, and generate a comprehensive report.

The implementation follows a 6-phase approach: core infrastructure setup, unification logic, breadcrumb correction, Solutions Hub creation, report generation, and Git integration.

## Tasks

- [ ] 1. Set up project structure and core infrastructure
  - [ ] 1.1 Create project directory structure and install dependencies
    - Create `scripts/schema-unification/` directory
    - Initialize package.json with required dependencies: cheerio, ajv, simple-git, glob
    - Set up TypeScript configuration if using TypeScript
    - Create `reports/seo/` directory for report output
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Implement HTML parser and JSON-LD extractor
    - Create `HTMLParser` class to load and parse HTML files using cheerio
    - Implement `extractJSONLD()` method to find all `<script type="application/ld+json">` blocks
    - Implement `extractVisualBreadcrumb()` method to parse breadcrumb navigation HTML
    - Implement `detectFAQContent()` method to check for FAQ elements (details, accordion, etc.)
    - _Requirements: 1.2, 1.3, 3.2, 3.3_

  - [ ] 1.3 Implement Schema validator using ajv
    - Create `SchemaValidator` class with ajv instance
    - Define validation schemas for Organization, WebPage, BreadcrumbList, FAQPage
    - Implement `validateSchema()` method to check Schema.org compliance
    - Implement `validateBreadcrumbSequence()` to check sequential positions
    - Implement `validateReferences()` to check @id references are valid
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 1.4 Write unit tests for HTML parser and validator
    - Test JSON-LD extraction with sample HTML containing multiple blocks
    - Test visual breadcrumb extraction with various HTML structures
    - Test FAQ content detection with different FAQ patterns
    - Test Schema validation with valid and invalid examples
    - Test breadcrumb sequence validation with non-sequential positions
    - _Requirements: 1.2, 1.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 2. Implement page scanning and discovery
  - [ ] 2.1 Create PageScanner class to discover and analyze HTML files
    - Implement `scanPaths()` method using glob to find all HTML files matching patterns
    - Implement `scanPage()` method to analyze a single HTML file
    - Extract all JSON-LD blocks and identify Schema types in each block
    - Detect duplicate Schema types within a single page
    - Return `PageScanResult` object with path, blocks, duplicates, breadcrumb, FAQ status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write unit tests for PageScanner
    - Test scanning with various HTML file patterns
    - Test duplicate detection with pages containing multiple WebPage schemas
    - Test FAQ detection with pages containing FAQ content
    - Test handling of malformed JSON-LD blocks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Checkpoint - Verify scanning and parsing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Schema unification engine
  - [ ] 4.1 Create SchemaUnificationEngine class for merging Schema entities
    - Implement `unifySchemas()` method to merge multiple JSON-LD blocks into single @graph
    - Implement `mergeEntities()` to combine Schema entities by type
    - Implement `removeDuplicates()` to eliminate duplicate Schema types (WebPage, BreadcrumbList, Organization, FAQPage)
    - Preserve unique entities and maintain @id references during merge
    - Ensure @context is set to "https://schema.org" and @graph is an array
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 4.2 Implement Schema type determination logic
    - Implement `determineSchemaTypes()` method to decide which Schema types to include
    - Always include Organization, WebSite, WebPage, and BreadcrumbList
    - Include FAQPage only if page has visible FAQ content
    - Include Article/BlogPosting if page has publication metadata
    - Include SoftwareApplication if page presents a software product
    - Do not include Schema types that don't match page content
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 4.3 Write unit tests for Schema unification
    - Test merging two JSON-LD blocks with duplicate WebPage
    - Test removing duplicate BreadcrumbList and Organization
    - Test preserving unique Schema entities during merge
    - Test Schema type determination for pages with/without FAQ content
    - Test @id reference preservation after unification
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3_

- [ ] 5. Implement breadcrumb validation and correction
  - [ ] 5.1 Create BreadcrumbValidator class for solution page breadcrumbs
    - Implement `validateSolutionBreadcrumb()` to check breadcrumb structure for solution pages
    - Implement `correctBreadcrumbPath()` to fix breadcrumb items
    - For solution pages, ensure exactly 3 items: "الرئيسية" → "الحلول" → solution name
    - Replace any "الخدمات" references with "الحلول"
    - Set correct URLs: position 1 = "https://brightai.site/", position 2 = "https://brightai.site/solutions/"
    - Validate sequential position values (1, 2, 3)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.3, 9.4_

  - [ ] 5.2 Implement visual breadcrumb HTML updater
    - Implement `ensureVisualMatch()` to update HTML breadcrumb navigation
    - Parse existing breadcrumb HTML structure
    - Update breadcrumb links and text to match BreadcrumbList JSON-LD
    - Preserve HTML structure and CSS classes
    - Ensure visual breadcrumb exactly matches JSON-LD structure
    - _Requirements: 5.6_

  - [ ]* 5.3 Write unit tests for breadcrumb validation
    - Test breadcrumb correction for solution pages with "الخدمات"
    - Test breadcrumb validation with non-sequential positions
    - Test visual breadcrumb HTML update with various HTML structures
    - Test breadcrumb validation for Solutions Hub (2 items)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 6. Checkpoint - Verify unification and breadcrumb logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Solutions Hub page creator
  - [ ] 7.1 Create SolutionsHubCreator class
    - Implement `checkExists()` method to check if `solutions/index.html` exists
    - Implement `createHub()` method to generate Solutions Hub HTML
    - Set page title to "حلول BrightAI لحوكمة وأمان الذكاء الاصطناعي"
    - Create navigation links to all 9 solution pages
    - Add proper meta tags (title, description, canonical)
    - Generate unified JSON-LD Schema with Organization, WebSite, WebPage, BreadcrumbList
    - Set BreadcrumbList with 2 items: "الرئيسية" (position 1) and "الحلول" (position 2)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 7.2 Write unit tests for Solutions Hub creator
    - Test Hub creation with correct HTML structure
    - Test Schema generation with correct breadcrumb (2 items)
    - Test navigation links to all solution pages
    - Test meta tags are properly set
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 8. Implement deduplication validation
  - [ ] 8.1 Create DeduplicationValidator class
    - Implement `validateNoDuplicates()` method to check for duplicate elements
    - Ensure exactly one H1 heading per page
    - Ensure exactly one canonical URL link per page
    - Ensure exactly one BreadcrumbList in @graph
    - Ensure exactly one WebPage in @graph
    - Ensure at most one FAQPage in @graph
    - Ensure at most one Organization in @graph
    - Merge or remove duplicates if found
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 8.2 Write unit tests for deduplication validation
    - Test detection of duplicate H1 headings
    - Test detection of duplicate canonical URLs
    - Test detection of duplicate Schema types in @graph
    - Test merging of duplicate Schema entities
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 9. Implement metadata preservation
  - [ ] 9.1 Create MetadataPreserver class
    - Implement `preserveMetadata()` method to protect existing metadata during modification
    - Preserve all `<meta name="description">` elements
    - Preserve all `<link rel="canonical">` elements
    - Preserve all Open Graph meta tags (`<meta property="og:*">`)
    - Preserve all Twitter Card meta tags (`<meta name="twitter:*">`)
    - Only modify JSON-LD blocks and visual breadcrumb HTML
    - Do not alter any other head elements or body content
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write unit tests for metadata preservation
    - Test that meta description is preserved after modification
    - Test that canonical URL is preserved after modification
    - Test that Open Graph tags are preserved after modification
    - Test that Twitter Card tags are preserved after modification
    - Test that only JSON-LD and breadcrumb are modified
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. Checkpoint - Verify all component logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement report generation
  - [ ] 11.1 Create ReportGenerator class
    - Implement `generateReport()` method to create comprehensive cleanup report
    - List all pages that contained duplicate Schema before cleanup
    - List all pages that were successfully cleaned and unified
    - Indicate whether Solutions Hub was created or already existed
    - Document final BreadcrumbList structure for each solution page
    - List pages requiring future manual review
    - Include summary section with total pages scanned, modified, and requiring attention
    - Include before-and-after examples for at least 2 representative pages
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ] 11.2 Implement Markdown report formatter
    - Implement `formatMarkdown()` method to format report as Markdown
    - Create sections for summary, pages scanned, pages modified, pages requiring review
    - Format before-and-after examples with code blocks
    - Add tables for solution page breadcrumb structures
    - Save report to `reports/seo/schema-breadcrumb-cleanup-report.md`
    - _Requirements: 8.1, 8.7, 8.8_

  - [ ]* 11.3 Write unit tests for report generation
    - Test report generation with sample processing results
    - Test Markdown formatting with various data structures
    - Test before-and-after example formatting
    - Test summary statistics calculation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 12. Implement Git integration
  - [ ] 12.1 Create GitManager class
    - Implement `validateRepository()` method to check if current directory is a git repo
    - Implement `stageFiles()` method to stage modified HTML files and report
    - Implement `createCommit()` method with message "Unify structured data and solution breadcrumbs"
    - Include all modified HTML files in commit
    - Include generated report file in commit
    - Include Solutions Hub file if created
    - Do not commit unrelated files or changes
    - Handle Git errors gracefully with clear error messages
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 12.2 Write integration tests for Git operations
    - Test Git operations in temporary test repository
    - Test staging modified files
    - Test commit creation with correct message
    - Test error handling for non-git directories
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 13. Implement main orchestrator
  - [ ] 13.1 Create SchemaUnifier main orchestrator class
    - Implement `run()` method to coordinate all components
    - Scan all HTML files using PageScanner
    - Process each page: unify Schema, correct breadcrumb, validate, preserve metadata
    - Create Solutions Hub if missing
    - Validate no duplicates remain
    - Generate comprehensive report
    - Stage and commit changes if not in dry-run mode
    - Implement error handling and rollback mechanism
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_

  - [ ] 13.2 Implement CLI interface with dry-run option
    - Parse command-line arguments (--dry-run, --execute)
    - Display progress messages during execution
    - Show summary of changes before committing
    - Provide clear error messages for failures
    - _Requirements: 1.1, 8.1, 10.1_

  - [ ]* 13.3 Write integration tests for full workflow
    - Test full workflow on sample HTML files in temporary directory
    - Test dry-run mode does not modify files
    - Test execute mode modifies files and creates commit
    - Test error handling and rollback on failure
    - Test Solutions Hub creation in full workflow
    - _Requirements: All requirements_

- [ ] 14. Final checkpoint and validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Create execution documentation
  - [ ] 15.1 Write README for the script
    - Document installation steps (npm install)
    - Document usage instructions (dry-run and execute modes)
    - Document expected output and report location
    - Document rollback procedure if issues occur
    - Add examples of before-and-after Schema structure
    - _Requirements: 8.1, 10.1_

  - [ ] 15.2 Create pre-deployment checklist
    - Document backup procedure (create backup branch)
    - Document validation steps (Google Rich Results Test, Schema.org validator)
    - Document post-deployment monitoring (Search Console, structured data reports)
    - Document rollback plan (git revert, restore from backup)
    - _Requirements: 10.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The script is designed to be idempotent (can run multiple times safely)
- All metadata (meta tags, Open Graph, Twitter Cards) is preserved during modification
- The system validates all Schema structures before writing to ensure compliance
- A comprehensive report documents all changes for review and audit

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1"] },
    { "id": 3, "tasks": ["2.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["4.3", "5.2", "7.1", "8.1", "9.1"] },
    { "id": 6, "tasks": ["5.3", "7.2", "8.2", "9.2", "11.1"] },
    { "id": 7, "tasks": ["11.2", "12.1"] },
    { "id": 8, "tasks": ["11.3", "12.2", "13.1"] },
    { "id": 9, "tasks": ["13.2"] },
    { "id": 10, "tasks": ["13.3", "15.1", "15.2"] }
  ]
}
```
