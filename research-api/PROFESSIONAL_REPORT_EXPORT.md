# SLI Research AI — Professional Report Exports

## Actions
- Export Markdown: existing report text download, unchanged.
- Export Word (.docx): actual editable WordprocessingML ZIP (OOXML). A4, Arial 11pt justified body; main title 20pt and headings 16/14/12.5pt; pale SLI wordmark at top-right running header, centered automatic PAGE field in footer. APA bibliography has hanging indents and italic report titles.
- PDF (Print/Save): a temporary A4 print view opens in browser. In Chrome choose Destination > Save as PDF, paper A4, and turn off browser default headers/footers to avoid duplicate page numbers. The print stylesheet includes SLI wordmark at top-right and Halaman X/Y footer via CSS page margin boxes (browser support varies). PDF is generated using the browser print workflow, not a direct server-rendered PDF binary.
- Both actions use the latest in-memory report and cited sources. No API key, owner token or raw user files are exported or uploaded by this feature.

## APA 7 preliminary bibliographic integrity
- Only sources actually cited in the answer are included; duplicate URLs count once. If original publication date or author is missing, the citation is not fabricated; unconvertible citations retain model [n] markers.
- Preliminary minimum: ten distinct cited sources with publisher/author, original title, publication year and original HTTPS URL; unreviewed Tavily previews, dashboard snapshots, and bare legal indices never count as eligible. The count measures metadata completeness, not scientific accuracy.
- Fewer than ten results in an explicitly marked DRAFT. Exports remain available; do not hallucinate references to meet a minimum.
- Even 10/10 does NOT certify source trustworthiness, article-to-claim entailment, legal validity, project status or academic publication readiness. A human researcher must inspect the primary documents and ensure entries conform to APA 7 (especially legal/journal/multiauthor sources).
- The footer, page fields, citation formatting, line breaks and tables need manual rendering inspection prior to client or journal distribution.

## Automated QA and known limitations
- GitHub Actions tests Word XML and ZIP CRC, Arial/justified and footer/page markers, A4 PDF stylesheet and HTML escaping, APA citation inclusion and draft warnings.
- Word stores charts as evidence tables where provided, not image screenshots; complex Markdown is simplified. PDF page numbering requires compatible Chromium page-margin-box support.
- Real browser print output and multi-page Word layout have not been independently visually inspected by CI; manual review is required.
- Research AI live output still requires independent scientific source verification. Exports are formatting functionality, not evidence certification.