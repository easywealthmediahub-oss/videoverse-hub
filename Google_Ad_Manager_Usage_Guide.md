# Google Ad Manager MVP - Usage Guide

## Overview
This guide explains how to use the Google Ad Manager integration in the admin dashboard. The system allows administrators to create and manage ad units, track performance metrics, and optimize ad revenue for the video platform.

## Accessing the Ad Management System

1. Log in to the admin dashboard
2. Navigate to the "Monetization" section
3. Select the "Ad Units" or "Ad Performance" tab

## Creating Ad Units

### Step 1: Navigate to Ad Units Tab
- Click on the "Ad Units" tab in the monetization section
- You'll see a form to create new ad units

### Step 2: Fill in Ad Unit Details
- **Ad Unit Name**: Enter a descriptive name for the ad unit (e.g., "Video Page Leaderboard", "Sidebar Banner")
- **Ad Format**: Select the type of ad:
  - Banner: Standard display ads
  - Video: Pre-roll, mid-roll, post-roll ads
  - Native: Ads that match content style
  - Interstitial: Full-screen ads
- **Status**: Set to "Active" to enable the ad unit
- **Ad Sizes**: Enter dimensions in format like "300x250, 728x90"
- **Targeting**: Optional JSON targeting parameters (e.g., `{"category": "technology"}`)

### Step 3: Save the Ad Unit
- Click "Create Ad Unit" to save
- The new ad unit will appear in the ad units list

## Managing Existing Ad Units

### Editing Ad Units
1. Click the three dots menu next to an ad unit
2. Select "Edit" from the dropdown
3. Make your changes in the form
4. Click "Update Ad Unit"

### Deleting Ad Units
1. Click the three dots menu next to an ad unit
2. Select "Delete" from the dropdown
3. Confirm the deletion in the confirmation dialog

## Ad Performance Tracking

### Viewing Performance Data
- Navigate to the "Ad Performance" tab
- See metrics including:
  - Impressions: Number of times ads were shown
  - Clicks: Number of clicks on ads
  - Revenue: Earnings from ads
  - CTR (Click-Through Rate): Percentage of clicks per impression
  - eCPM (Effective Cost Per Mille): Earnings per 1000 impressions

### Performance Metrics Explained
- **Impressions**: Total number of ad views
- **Clicks**: Total number of ad clicks
- **CTR**: Click-Through Rate (clicks ÷ impressions × 100)
- **eCPM**: Effective revenue per 1000 impressions
- **Revenue**: Total earnings from ad units

## Ad Formats and Sizes

### Common Banner Sizes
- 300x250: Medium Rectangle (most common)
- 728x90: Leaderboard (desktop)
- 320x50: Mobile Banner
- 160x600: Wide Skyscraper
- 300x600: Half Page

### Video Ad Types
- **Pre-roll**: Shown before video content
- **Mid-roll**: Shown during video playback (at specified time intervals)
- **Post-roll**: Shown after video content

## Best Practices

### Ad Placement
- Place ads where they're visible but not intrusive
- Avoid placing ads too close to video player controls
- Consider user experience when positioning ads

### Performance Optimization
- Monitor CTR to ensure ads are engaging
- Track eCPM to optimize revenue per impression
- A/B test different ad formats and placements
- Regularly review underperforming ad units

### Ad Unit Management
- Use descriptive names for easy identification
- Regularly review and update targeting parameters
- Pause or delete underperforming ad units
- Maintain a balance between ad revenue and user experience

## Troubleshooting

### Ad Units Not Showing
- Verify ad unit status is set to "Active"
- Check that ad sizes match available space
- Ensure ad targeting parameters are correctly formatted

### Performance Issues
- Low CTR may indicate irrelevant ad content
- Low eCPM may require ad format or placement optimization
- High impression counts with low revenue may indicate invalid traffic

## Integration with Video Content

### Video Ad Integration
- Pre-roll ads play before video content
- Mid-roll ads can be configured at specific time intervals
- Post-roll ads play after video completion
- All video ads support skip functionality after 5 seconds

### Revenue Attribution
- Ad revenue is tracked per ad unit
- Performance data is aggregated by date
- Revenue can be attributed to specific video content types

## Security and Privacy

### Data Protection
- User data is anonymized for ad targeting
- Ad tracking complies with privacy regulations
- Revenue data is securely stored and processed

### Access Control
- Only admin users can manage ad units
- Ad performance data is restricted to authorized personnel
- All ad management actions are logged

## API Integration Notes

### Ad Serving
- Ad units are served via Google Ad Manager
- Real-time bidding integration for maximum revenue
- Responsive ad units adapt to different screen sizes

### Tracking
- Impressions and clicks are tracked automatically
- Revenue data is updated in real-time
- Performance metrics are calculated daily

This guide provides a comprehensive overview of using the Google Ad Manager MVP system. For additional support, consult the technical documentation or contact the development team.