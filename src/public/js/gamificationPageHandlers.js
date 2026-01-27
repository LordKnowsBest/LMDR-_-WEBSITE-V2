/**
 * Gamification Page Handlers
 * Shared module for handling gamification widget communication in Wix pages
 *
 * Usage in page code:
 * import { setupDriverGamification, setupRecruiterGamification } from 'public/js/gamificationPageHandlers';
 *
 * $w.onReady(() => {
 *   const gamificationWidget = $w('#gamificationHtml');
 *   if (gamificationWidget) {
 *     setupDriverGamification(gamificationWidget);
 *   }
 * });
 */

// ============================================================================
// DRIVER GAMIFICATION HANDLERS
// ============================================================================

/**
 * Set up gamification widget communication for drivers
 * @param {$w.HtmlComponent} htmlComponent - The HTML component containing DRIVER_GAMIFICATION.html
 */
export function setupDriverGamification(htmlComponent) {
    if (!htmlComponent) {
        console.warn('Gamification HTML component not found');
        return;
    }

    console.log('🎮 Setting up driver gamification handlers');

    htmlComponent.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('📥 [Gamification] Received:', msg.type);

        try {
            switch (msg.type) {
                case 'gamificationReady':
                    await loadDriverGamificationData(htmlComponent);
                    break;

                case 'refreshGamification':
                    await loadDriverGamificationData(htmlComponent);
                    break;

                case 'startChallenge':
                    await handleStartChallenge(htmlComponent, msg.data, 'driver');
                    break;

                case 'claimReward':
                    await handleClaimReward(htmlComponent, msg.data, 'driver');
                    break;

                case 'viewChallenges':
                    handleNavigate('/driver-challenges');
                    break;

                case 'viewAchievements':
                    handleNavigate('/driver-badges');
                    break;

                case 'navigateTo':
                    handleRecommendationNavigation(msg.data);
                    break;

                case 'ping':
                    sendToWidget(htmlComponent, 'pong', { timestamp: Date.now() });
                    break;

                default:
                    console.warn('Unhandled gamification message:', msg.type);
            }
        } catch (error) {
            console.error('Gamification handler error:', error);
            sendToWidget(htmlComponent, 'error', { message: error.message });
        }
    });
}

/**
 * Load driver gamification data and send to widget
 */
async function loadDriverGamificationData(htmlComponent) {
    console.log('📊 Loading driver gamification data...');

    try {
        // Import gamification services dynamically
        const { getDriverProgression } = await import('backend/gamificationService');
        const { getActiveChallenges } = await import('backend/challengeService');
        const { getAchievements } = await import('backend/achievementService');

        // Get current user
        const wixUsers = await import('wix-users');
        if (!wixUsers.currentUser.loggedIn) {
            sendToWidget(htmlComponent, 'error', { message: 'Not logged in' });
            return;
        }

        const userId = wixUsers.currentUser.id;

        // Load data in parallel
        const [progressionResult, challengesResult, achievementsResult] = await Promise.all([
            getDriverProgression(userId).catch(err => ({ success: false, error: err.message })),
            getActiveChallenges(userId, 'driver').catch(err => ({ success: false, challenges: [] })),
            getAchievements(userId, 'driver', { limit: 8 }).catch(err => ({ success: false, achievements: [] }))
        ]);

        // Build recommendations based on progression
        const recommendations = buildDriverRecommendations(progressionResult.progression);

        sendToWidget(htmlComponent, 'gamificationData', {
            progression: progressionResult.progression || getDefaultDriverProgression(),
            challenges: challengesResult.challenges || [],
            achievements: achievementsResult.achievements || [],
            recommendations: recommendations
        });

    } catch (error) {
        console.error('Failed to load gamification data:', error);
        // Send default data so widget still works
        sendToWidget(htmlComponent, 'gamificationData', {
            progression: getDefaultDriverProgression(),
            challenges: [],
            achievements: [],
            recommendations: getDefaultDriverRecommendations()
        });
    }
}

function getDefaultDriverProgression() {
    return {
        level: 1,
        level_title: 'Rookie',
        current_xp: 0,
        xp_for_next_level: 500,
        xp_progress_percent: 0,
        current_streak: 0,
        streak_freezes: 1,
        streak_multiplier: 1
    };
}

function getDefaultDriverRecommendations() {
    return [
        { icon: 'fa-user-pen', title: 'Complete your profile', description: 'Add your experience and certifications', action: 'profile', xp: 100 },
        { icon: 'fa-briefcase', title: 'Apply to a job', description: 'Browse carrier opportunities', action: 'jobs', xp: 50 },
        { icon: 'fa-calendar-check', title: 'Log in daily', description: 'Build your streak for bonus XP', action: 'streak', xp: 25 }
    ];
}

function buildDriverRecommendations(progression) {
    const recommendations = [];

    if (!progression) return getDefaultDriverRecommendations();

    // Profile completion
    if (!progression.profile_complete) {
        recommendations.push({
            icon: 'fa-user-pen',
            title: 'Complete your profile',
            description: 'Get 100% profile completion',
            action: 'profile',
            xp: 100
        });
    }

    // Streak building
    if ((progression.current_streak || 0) < 7) {
        recommendations.push({
            icon: 'fa-fire',
            title: 'Build your streak',
            description: `${7 - (progression.current_streak || 0)} days to unlock 1.25x multiplier`,
            action: 'streak',
            xp: 25
        });
    }

    // Apply to jobs
    recommendations.push({
        icon: 'fa-briefcase',
        title: 'Browse job opportunities',
        description: 'Find your next career move',
        action: 'jobs',
        xp: 50
    });

    return recommendations.slice(0, 3);
}

// ============================================================================
// RECRUITER GAMIFICATION HANDLERS
// ============================================================================

/**
 * Set up gamification widget communication for recruiters
 * @param {$w.HtmlComponent} htmlComponent - The HTML component containing RECRUITER_GAMIFICATION.html
 */
export function setupRecruiterGamification(htmlComponent) {
    if (!htmlComponent) {
        console.warn('Gamification HTML component not found');
        return;
    }

    console.log('🎮 Setting up recruiter gamification handlers');

    htmlComponent.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('📥 [Gamification] Received:', msg.type);

        try {
            switch (msg.type) {
                case 'recruiterGamificationReady':
                    await loadRecruiterGamificationData(htmlComponent);
                    break;

                case 'refreshGamification':
                    await loadRecruiterGamificationData(htmlComponent);
                    break;

                case 'startChallenge':
                    await handleStartChallenge(htmlComponent, msg.data, 'recruiter');
                    break;

                case 'claimReward':
                    await handleClaimReward(htmlComponent, msg.data, 'recruiter');
                    break;

                case 'viewLeaderboard':
                    handleNavigate('/recruiter-leaderboard');
                    break;

                case 'viewBadges':
                    handleNavigate('/recruiter-badges');
                    break;

                case 'viewChallenges':
                    handleNavigate('/recruiter-challenges');
                    break;

                case 'ping':
                    sendToWidget(htmlComponent, 'pong', { timestamp: Date.now() });
                    break;

                default:
                    console.warn('Unhandled gamification message:', msg.type);
            }
        } catch (error) {
            console.error('Gamification handler error:', error);
            sendToWidget(htmlComponent, 'error', { message: error.message });
        }
    });
}

/**
 * Load recruiter gamification data and send to widget
 */
async function loadRecruiterGamificationData(htmlComponent) {
    console.log('📊 Loading recruiter gamification data...');

    try {
        // Import gamification services dynamically
        const { getRecruiterProgression } = await import('backend/gamificationService');
        const { getBadges } = await import('backend/badgeService');
        const { getUserLeaderboardPosition } = await import('backend/leaderboardService');
        const { getActiveChallenges } = await import('backend/challengeService');
        const { getRecruiterWeeklyStats } = await import('backend/recruiterStats');

        // Get current user
        const wixUsers = await import('wix-users');
        if (!wixUsers.currentUser.loggedIn) {
            sendToWidget(htmlComponent, 'error', { message: 'Not logged in' });
            return;
        }

        const userId = wixUsers.currentUser.id;

        // Load data in parallel
        const [progressionResult, badgesResult, leaderboardResult, challengesResult, weeklyStatsResult] = await Promise.all([
            getRecruiterProgression(userId).catch(err => ({ success: false })),
            getBadges(userId, 'recruiter').catch(err => ({ success: false, badges: [] })),
            getUserLeaderboardPosition(userId, 'overall', 'weekly').catch(err => ({ position: null })),
            getActiveChallenges(userId, 'recruiter').catch(err => ({ challenges: [] })),
            getRecruiterWeeklyStats(userId).catch(err => ({ stats: {} }))
        ]);

        sendToWidget(htmlComponent, 'recruiterGamificationData', {
            progression: progressionResult.progression || getDefaultRecruiterProgression(),
            badges: badgesResult.badges || [],
            leaderboard: {
                position: leaderboardResult.position || '--',
                period: 'This Week',
                rankChange: leaderboardResult.rankChange || 0
            },
            challenges: challengesResult.challenges || [],
            weeklyStats: weeklyStatsResult.stats || {
                hires: 0,
                responses: 0,
                interviews: 0,
                messages: 0,
                points: 0
            }
        });

    } catch (error) {
        console.error('Failed to load gamification data:', error);
        // Send default data so widget still works
        sendToWidget(htmlComponent, 'recruiterGamificationData', {
            progression: getDefaultRecruiterProgression(),
            badges: [],
            leaderboard: { position: '--', period: 'This Week' },
            challenges: [],
            weeklyStats: { hires: 0, responses: 0, interviews: 0, messages: 0, points: 0 }
        });
    }
}

function getDefaultRecruiterProgression() {
    return {
        rank: 'Associate',
        total_points: 0,
        points_for_next_rank: 1000,
        progress_percent: 0,
        next_rank: 'Specialist'
    };
}

// ============================================================================
// CHALLENGES PAGE HANDLERS
// ============================================================================

/**
 * Set up challenges page communication
 * @param {$w.HtmlComponent} htmlComponent - The HTML component containing CHALLENGES.html
 * @param {string} userType - 'driver' or 'recruiter'
 */
export function setupChallengesPage(htmlComponent, userType = 'driver') {
    if (!htmlComponent) {
        console.warn('Challenges HTML component not found');
        return;
    }

    console.log(`🎮 Setting up ${userType} challenges page handlers`);

    htmlComponent.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('📥 [Challenges] Received:', msg.type);

        try {
            switch (msg.type) {
                case 'challengesReady':
                    await loadChallengesPageData(htmlComponent, userType);
                    break;

                case 'startChallenge':
                    await handleStartChallenge(htmlComponent, msg.data, userType);
                    break;

                case 'claimReward':
                    await handleClaimReward(htmlComponent, msg.data, userType);
                    break;

                case 'ping':
                    sendToWidget(htmlComponent, 'pong', { timestamp: Date.now() });
                    break;

                default:
                    console.warn('Unhandled challenges message:', msg.type);
            }
        } catch (error) {
            console.error('Challenges handler error:', error);
            sendToWidget(htmlComponent, 'error', { message: error.message });
        }
    });
}

async function loadChallengesPageData(htmlComponent, userType) {
    console.log(`📊 Loading ${userType} challenges data...`);

    try {
        const { getActiveChallenges, getAvailableChallenges, getChallengeHistory } = await import('backend/challengeService');

        const wixUsers = await import('wix-users');
        if (!wixUsers.currentUser.loggedIn) {
            sendToWidget(htmlComponent, 'error', { message: 'Not logged in' });
            return;
        }

        const userId = wixUsers.currentUser.id;

        const [activeResult, availableResult, completedResult] = await Promise.all([
            getActiveChallenges(userId, userType).catch(err => ({ challenges: [] })),
            getAvailableChallenges(userId, userType).catch(err => ({ challenges: [] })),
            getChallengeHistory(userId, userType, { limit: 20 }).catch(err => ({ challenges: [] }))
        ]);

        sendToWidget(htmlComponent, 'challengesData', {
            userType: userType,
            active: activeResult.challenges || [],
            available: availableResult.challenges || [],
            completed: completedResult.challenges || []
        });

    } catch (error) {
        console.error('Failed to load challenges data:', error);
        sendToWidget(htmlComponent, 'challengesData', {
            userType: userType,
            active: [],
            available: [],
            completed: []
        });
    }
}

// ============================================================================
// LEADERBOARD PAGE HANDLERS
// ============================================================================

/**
 * Set up leaderboard page communication
 * @param {$w.HtmlComponent} htmlComponent - The HTML component containing RECRUITER_LEADERBOARD.html
 */
export function setupLeaderboardPage(htmlComponent) {
    if (!htmlComponent) {
        console.warn('Leaderboard HTML component not found');
        return;
    }

    console.log('🎮 Setting up leaderboard page handlers');

    htmlComponent.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('📥 [Leaderboard] Received:', msg.type);

        try {
            switch (msg.type) {
                case 'leaderboardReady':
                    await loadLeaderboardData(htmlComponent, 'overall', 'weekly', 1);
                    break;

                case 'getLeaderboard':
                    await loadLeaderboardData(
                        htmlComponent,
                        msg.data?.type || 'overall',
                        msg.data?.period || 'weekly',
                        msg.data?.page || 1
                    );
                    break;

                case 'ping':
                    sendToWidget(htmlComponent, 'pong', { timestamp: Date.now() });
                    break;

                default:
                    console.warn('Unhandled leaderboard message:', msg.type);
            }
        } catch (error) {
            console.error('Leaderboard handler error:', error);
            sendToWidget(htmlComponent, 'error', { message: error.message });
        }
    });
}

async function loadLeaderboardData(htmlComponent, type, period, page) {
    console.log(`📊 Loading leaderboard: ${type} / ${period} / page ${page}`);

    try {
        const { getLeaderboard, getUserLeaderboardPosition } = await import('backend/leaderboardService');

        const wixUsers = await import('wix-users');
        const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : null;

        const limit = 20;
        const offset = (page - 1) * limit;

        const [leaderboardResult, userPositionResult] = await Promise.all([
            getLeaderboard(type, period, { limit, offset }),
            userId ? getUserLeaderboardPosition(userId, type, period) : Promise.resolve({})
        ]);

        const messageType = page === 1 ? 'leaderboardData' : 'leaderboardPage';

        sendToWidget(htmlComponent, messageType, {
            rankings: leaderboardResult.rankings || [],
            currentUser: userId ? {
                _id: userId,
                position: userPositionResult.position,
                score: userPositionResult.score,
                name: userPositionResult.name,
                rankChange: userPositionResult.rankChange || 0,
                pointsToNext: userPositionResult.pointsToNext || 0
            } : null,
            hasMore: (leaderboardResult.rankings?.length || 0) >= limit,
            page: page
        });

    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        sendToWidget(htmlComponent, page === 1 ? 'leaderboardData' : 'leaderboardPage', {
            rankings: [],
            currentUser: null,
            hasMore: false,
            page: page
        });
    }
}

// ============================================================================
// BADGES PAGE HANDLERS
// ============================================================================

/**
 * Set up badges/achievements page communication
 * @param {$w.HtmlComponent} htmlComponent - The HTML component containing DRIVER_BADGES.html
 */
export function setupBadgesPage(htmlComponent) {
    if (!htmlComponent) {
        console.warn('Badges HTML component not found');
        return;
    }

    console.log('🎮 Setting up badges page handlers');

    htmlComponent.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('📥 [Badges] Received:', msg.type);

        try {
            switch (msg.type) {
                case 'badgesReady':
                    await loadBadgesData(htmlComponent);
                    break;

                case 'updateFeatured':
                    await handleUpdateFeatured(htmlComponent, msg.data);
                    break;

                case 'ping':
                    sendToWidget(htmlComponent, 'pong', { timestamp: Date.now() });
                    break;

                default:
                    console.warn('Unhandled badges message:', msg.type);
            }
        } catch (error) {
            console.error('Badges handler error:', error);
            sendToWidget(htmlComponent, 'error', { message: error.message });
        }
    });
}

async function loadBadgesData(htmlComponent) {
    console.log('📊 Loading achievements data...');

    try {
        const { getAchievements, getFeaturedAchievements } = await import('backend/achievementService');

        const wixUsers = await import('wix-users');
        if (!wixUsers.currentUser.loggedIn) {
            sendToWidget(htmlComponent, 'error', { message: 'Not logged in' });
            return;
        }

        const userId = wixUsers.currentUser.id;

        const [achievementsResult, featuredResult] = await Promise.all([
            getAchievements(userId, 'driver', { includeProgress: true }),
            getFeaturedAchievements(userId).catch(() => ({ featured: [] }))
        ]);

        sendToWidget(htmlComponent, 'achievementsData', {
            achievements: achievementsResult.achievements || [],
            featured: featuredResult.featured || []
        });

    } catch (error) {
        console.error('Failed to load achievements:', error);
        sendToWidget(htmlComponent, 'achievementsData', {
            achievements: [],
            featured: []
        });
    }
}

async function handleUpdateFeatured(htmlComponent, data) {
    if (!data || !data.featured) return;

    try {
        const { updateFeaturedAchievements } = await import('backend/achievementService');

        const wixUsers = await import('wix-users');
        const userId = wixUsers.currentUser.id;

        const result = await updateFeaturedAchievements(userId, data.featured);

        sendToWidget(htmlComponent, 'featuredUpdated', {
            success: result.success,
            featured: data.featured
        });

    } catch (error) {
        console.error('Failed to update featured:', error);
        sendToWidget(htmlComponent, 'error', { message: error.message });
    }
}

// ============================================================================
// SHARED HANDLERS
// ============================================================================

async function handleStartChallenge(htmlComponent, data, userType) {
    if (!data || !data.challengeId) {
        sendToWidget(htmlComponent, 'error', { message: 'Challenge ID required' });
        return;
    }

    try {
        const { startChallenge } = await import('backend/challengeService');

        const wixUsers = await import('wix-users');
        const userId = wixUsers.currentUser.id;

        const result = await startChallenge(userId, data.challengeId, userType);

        if (result.success) {
            sendToWidget(htmlComponent, 'challengeStarted', {
                _id: data.challengeId,
                ...result.challenge
            });
        } else {
            sendToWidget(htmlComponent, 'error', { message: result.error || 'Failed to start challenge' });
        }

    } catch (error) {
        console.error('Failed to start challenge:', error);
        sendToWidget(htmlComponent, 'error', { message: error.message });
    }
}

async function handleClaimReward(htmlComponent, data, userType) {
    if (!data || !data.challengeId) {
        sendToWidget(htmlComponent, 'error', { message: 'Challenge ID required' });
        return;
    }

    try {
        const { claimChallengeReward } = await import('backend/challengeService');

        const wixUsers = await import('wix-users');
        const userId = wixUsers.currentUser.id;

        const result = await claimChallengeReward(userId, data.challengeId, userType);

        if (result.success) {
            sendToWidget(htmlComponent, 'rewardClaimed', {
                _id: data.challengeId,
                xp_reward: result.xp_awarded,
                points_reward: result.points_awarded
            });
        } else {
            sendToWidget(htmlComponent, 'error', { message: result.error || 'Failed to claim reward' });
        }

    } catch (error) {
        console.error('Failed to claim reward:', error);
        sendToWidget(htmlComponent, 'error', { message: error.message });
    }
}

function handleRecommendationNavigation(data) {
    if (!data || !data.action) return;

    const routes = {
        'profile': '/member-page',
        'jobs': '/ai-matching',
        'streak': '/driver-dashboard',
        'apply': '/ai-matching'
    };

    const route = routes[data.action] || '/driver-dashboard';
    handleNavigate(route);
}

async function handleNavigate(route) {
    try {
        const wixLocation = await import('wix-location');
        wixLocation.to(route);
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

function sendToWidget(htmlComponent, type, data) {
    console.log('📤 [Gamification] Sending:', type);
    htmlComponent.postMessage({ type, data, timestamp: Date.now() });
}
