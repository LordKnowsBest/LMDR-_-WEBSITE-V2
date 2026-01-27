# v2_Driver Jobs

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEvfkqyf4SEbGUO` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fld7PsJ5rxVCx3UEK` | Job title |
| Description | Long Text / Multiline | `fld90Vzt6kYoxlpr9` | Full job description |
| City | Single Line Text | `fldbXoy7iAiUoqZNn` | Job location city |
| State | Single Line Text | `fldnMZWt7VK0eE90o` | Job location state |
| Pay Min | Currency ($) | `fldsYlVXX3LRhjOPB` | Minimum pay |
| Pay Max | Currency ($) | `fld2Vc2pGNTDYJCDa` | Maximum pay |
| Status | Single Select (`Draft`, `Active`, `Paused`, `Closed`) | `fldQ91E3qL0YYplH3` | Job posting status |
| Posted Date | Date | `fldG4P2pkOHRQdLCY` | Date job was posted |
| Legacy Wix ID | Single Line Text | `fldJBJZt1JnKmuedR` | Original Wix _id for migration reference |
| driverType | Single Line Text | `fld9ZLLkrhy8cJA5P` | Type of driver, e.g., CDL, Last Mile, Non-CDL |
| routeType | Single Line Text | `fld1rR6PGPP2gryH5` | Type of route, e.g., OTR, Regional, Local |
| payRate | Number (precision: 0) | `fldE1uFcFGeyp0Tdd` | Pay rate |
| companyLogo | URL | `fldGwRl3F3aZtWCJA` | Image URL representing the company or job |
| employmentType | Single Line Text | `fldYgtV1fGjjDssZa` | Full-time, part time, Temp |
| benefits | Single Line Text | `fld4ZBPJg4fdRJCao` | Home time + possible bonus opportunities |
| jobTitle | Single Line Text | `fldzfNdtBt3x4rlX0` | CDL-A OTR Reefer Driver, Local Non-CDL Delivery, Regional CDL-A Dry Van Driver, Last Mile Driver, CDL-A Team Drivers |
| applicationLink | URL | `fldFxoWv161r8IGLc` | Directs to application form |
| datePosted | Single Line Text | `fldNZpHMxqCY3saHi` | Date/Time |
| validThrough | Single Line Text | `fldYcF8ngxLtwDbBG` | Date/Time |
| postalCode | Number (precision: 0) | `fldHXgackcejtdUFx` | Zipcode |
| hiringLocation | Single Line Text | `fldskx3E80lIw5NQt` | Hiring location |
| phone | Single Line Text | `fldZux6YQ2gxB6vCi` | Phone number |
| jobDescription1 | Single Line Text | `fldsQ5u91HKXzmU3W` | Extended job description |
| companyBase | Single Line Text | `fldOWhJ6rR5JUpBgI` | Company base location |
| streetAddress | Single Line Text | `fldZZ42G639KXHiOc` | Street address |
| _owner | Single Line Text | `fldffviWdvMvINkD7` | Owner ID (Wix system field) |
| _createdDate | Date | `fldcwbgUwyzE9qvAS` | Created date (Wix system field) |
| _updatedDate | Date | `fld9TS7bKSyumCsK8` | Updated date (Wix system field) |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Driver Jobs': {
  'title': 'Title',
  'description': 'Description',
  'city': 'City',
  'state': 'State',
  'pay_min': 'Pay Min',
  'pay_max': 'Pay Max',
  'status': 'Status',
  'posted_date': 'Posted Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'drivertype': 'driverType',
  'routetype': 'routeType',
  'payrate': 'payRate',
  'companylogo': 'companyLogo',
  'employmenttype': 'employmentType',
  'benefits': 'benefits',
  'jobtitle': 'jobTitle',
  'applicationlink': 'applicationLink',
  'dateposted': 'datePosted',
  'validthrough': 'validThrough',
  'postalcode': 'postalCode',
  'hiringlocation': 'hiringLocation',
  'phone': 'phone',
  'jobdescription1': 'jobDescription1',
  'companybase': 'companyBase',
  'streetaddress': 'streetAddress',
  'owner': '_owner',
  'createddate': '_createdDate',
  'updateddate': '_updatedDate',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
