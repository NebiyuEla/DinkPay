import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../config';
import { formatEtb, formatNumber } from '../utils/format';

const getCampaignDeadline = () => {
  const now = new Date();
  const target = new Date(now.getFullYear(), 3, 19, 23, 59, 59);
  return now > target ? new Date(now.getFullYear() + 1, 3, 19, 23, 59, 59) : target;
};

const getCountdownParts = (targetDate) => {
  const remainingMs = Math.max(targetDate.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

const getReferralSeed = (user) => {
  const source = String(user?.telegramId || user?._id || user?.id || user?.email || user?.fullName || 'dinkpay');
  return Array.from(source).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);
};

const buildCampaignModel = (user) => {
  const inviteTarget = Number(user?.referralStats?.target) || 50;
  const invites = Math.min(Number(user?.referralStats?.invites) || 0, inviteTarget);
  const successfulOrders = Math.max(Number(user?.referralStats?.successfulOrders) || 0, 0);
  const earnings = Math.max(Number(user?.referralStats?.earnings) || 0, 0);
  const inviteCode = user?.referralCode || `ref_${user?.telegramId || user?._id || user?.id || String(user?.email || 'dink').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

  return {
    title: 'Referral Campaign',
    description: 'Invite friends, grow your reach, and earn 5% commission on each successful order.',
    active: true,
    endsAt: getCampaignDeadline().toISOString(),
    inviteTarget,
    minimumPrizeInvites: 50,
    invites,
    successfulOrders,
    earnings,
    commissionPercent: 5,
    points: invites * 18 + successfulOrders * 30,
    inviteCode,
    referralLink: `https://t.me/DinkPaymentBot?start=${encodeURIComponent(inviteCode)}&startapp=${encodeURIComponent(inviteCode)}`,
    leaderboard: [],
    history: [],
    prizes: [
      { place: '1st', title: 'Grand Prize', reward: '20,000 ETB cash reward' },
      { place: '2nd', title: 'Champion Bonus', reward: '12,000 ETB cash reward' },
      { place: '3rd', title: 'Growth Reward', reward: '7,500 ETB bonus payout' },
      { place: '4th', title: 'Top Performer', reward: '5,000 ETB service credit' },
      { place: '5th', title: 'Momentum Prize', reward: '2,500 ETB service credit' }
    ]
  };
};

const normalizeReferralData = (referral, user) => {
  const fallback = buildCampaignModel(user);
  if (!referral?.campaign) {
    return fallback;
  }

  return {
    title: referral.campaign.title || fallback.title,
    description: referral.campaign.description || fallback.description,
    active: referral.campaign.active !== false,
    endsAt: referral.campaign.endsAt || fallback.endsAt,
    inviteTarget: Number(referral.progress?.targetInvites || referral.campaign.targetInvites) || fallback.inviteTarget,
    minimumPrizeInvites: Number(referral.campaign.minimumPrizeInvites) || fallback.minimumPrizeInvites,
    invites: Number(referral.progress?.invites) || fallback.invites,
    successfulOrders: Number(referral.earnings?.successfulOrders) || fallback.successfulOrders,
    earnings: Number(referral.earnings?.earnings) || fallback.earnings,
    commissionPercent: Number(referral.earnings?.commissionPercent || referral.campaign.commissionPercent) || fallback.commissionPercent,
    points: Number(referral.earnings?.points) || fallback.points,
    inviteCode: referral.referralCode || fallback.inviteCode,
    referralLink: referral.referralLink || fallback.referralLink,
    leaderboard:
      Array.isArray(referral.leaderboard) && referral.leaderboard.length > 0
        ? referral.leaderboard.map((entry) => ({
            badge: entry.badge,
            name: entry.name,
            invites: Number(entry.invites) || 0,
            reward: `${formatEtb(Number(entry.earnings) || 0)} earned`
          }))
        : fallback.leaderboard,
    history: Array.isArray(referral.history) && referral.history.length > 0 ? referral.history : fallback.history,
    prizes:
      Array.isArray(referral.campaign.prizes) && referral.campaign.prizes.length > 0
        ? referral.campaign.prizes
        : fallback.prizes
  };
};

const countdownTileStyle = {
  padding: '14px 12px',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  textAlign: 'center'
};

const sectionCardStyle = {
  padding: '18px',
  borderRadius: '24px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 14px 30px rgba(0,0,0,0.16)'
};

const ReferralScreen = ({ user, onBack }) => {
  const [campaign, setCampaign] = useState(() => buildCampaignModel(user));
  const [shareFeedback, setShareFeedback] = useState('');
  const campaignDeadline = useMemo(() => {
    const parsed = new Date(campaign?.endsAt || getCampaignDeadline());
    return Number.isNaN(parsed.getTime()) ? getCampaignDeadline() : parsed;
  }, [campaign?.endsAt]);
  const [countdown, setCountdown] = useState(() => getCountdownParts(campaignDeadline));
  const progressPercent = Math.min((campaign.invites / campaign.inviteTarget) * 100, 100);
  const campaignDeadlineLabel = campaignDeadline.toLocaleDateString([], { month: 'long', day: 'numeric' });
  const leaderboardEntries = Array.isArray(campaign.leaderboard) ? campaign.leaderboard : [];
  const historyEntries = Array.isArray(campaign.history) ? campaign.history : [];

  useEffect(() => {
    setCountdown(getCountdownParts(campaignDeadline));
    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts(campaignDeadline));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [campaignDeadline]);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('dinkToken');

    if (!token) {
      return undefined;
    }

    const loadReferralData = async () => {
      try {
        const response = await fetch(`${API_URL}/referrals/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load the referral campaign right now.');
        }

        if (active && data.success) {
          setCampaign(normalizeReferralData(data.referral, user));
        }
      } catch (error) {
        console.error('Referral load error:', error);
        if (active) {
          setCampaign(buildCampaignModel(user));
        }
      }
    };

    loadReferralData();

    return () => {
      active = false;
    };
  }, [user]);

  const handleShare = async () => {
    const shareCopy = campaign.description || `Join the DINK Pay Referral Campaign and earn ${campaign.commissionPercent}% commission.`;
    const shareText = `${shareCopy} ${campaign.referralLink}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(campaign.referralLink)}&text=${encodeURIComponent(shareCopy)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: campaign.title || 'DINK Pay Referral Campaign',
          text: shareCopy,
          url: campaign.referralLink
        });
        setShareFeedback('Invite shared successfully.');
        return;
      }

      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(telegramShareUrl);
        setShareFeedback('Opening Telegram share.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback('Referral link copied to clipboard.');
        return;
      }

      window.prompt('Copy your referral link', campaign.referralLink);
      setShareFeedback('Referral link ready to copy.');
    } catch (error) {
      console.error('Share error:', error);
      setShareFeedback('Unable to share right now. Try again in a moment.');
    }
  };

  const sectionMotion = (delay) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, delay }
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      style={{ height: '100%', overflowY: 'auto', padding: '12px 0 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '21px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(73,250,132,0.15)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{campaign.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '13px' }}>
            {campaign.description}
          </p>
        </div>
      </div>

      <motion.div
        {...sectionMotion(0.02)}
        style={{
          ...sectionCardStyle,
          marginBottom: '14px',
          background:
            'linear-gradient(145deg, rgba(73,250,132,0.18), rgba(33,149,255,0.14) 48%, rgba(4,10,22,0.52) 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
          <div>
            <span className={`badge ${campaign.active ? 'badge-completed' : 'badge-pending'}`} style={{ marginBottom: '12px' }}>
              {campaign.active ? 'Live campaign' : 'Campaign paused'}
            </span>
            <h2 style={{ margin: 0, fontSize: '24px', lineHeight: 1.1 }}>Bring friends to DINK Pay before {campaignDeadlineLabel}</h2>
            <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.68)', fontSize: '14px', lineHeight: 1.55 }}>
              {campaign.description}
            </p>
          </div>
          <div
            style={{
              minWidth: '92px',
              padding: '12px',
              borderRadius: '18px',
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.54)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Progress
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#49FA84', marginTop: '6px' }}>
              {campaign.invites}/{campaign.inviteTarget}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
          {[
            { label: 'Days', value: countdown.days },
            { label: 'Hours', value: countdown.hours },
            { label: 'Minutes', value: countdown.minutes },
            { label: 'Seconds', value: countdown.seconds }
          ].map((item) => (
            <div key={item.label} style={countdownTileStyle}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>{String(item.value).padStart(2, '0')}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.54)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...sectionMotion(0.08)} style={{ ...sectionCardStyle, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Your referral progress</h3>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '13px' }}>
              {campaign.invites} invites confirmed out of {campaign.inviteTarget} goal
            </p>
          </div>
          <span className="badge badge-completed">{Math.round(progressPercent)}% complete</span>
        </div>
        <div
          style={{
            height: '12px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #49FA84, #2FD4FF)'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.54)', marginBottom: '8px' }}>Invite link</div>
            <div style={{ fontWeight: 700, lineHeight: 1.4, wordBreak: 'break-word' }}>{campaign.referralLink}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
          <button type="button" className="primary-button" onClick={handleShare}>
            Invite and Share
          </button>
          {shareFeedback ? (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.66)', textAlign: 'center' }}>{shareFeedback}</div>
          ) : null}
        </div>
      </motion.div>

      <motion.div {...sectionMotion(0.14)} style={{ display: 'grid', gap: '14px', marginBottom: '14px' }}>
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Earnings</h3>
              <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '13px' }}>
                5% commission on each successful order
              </p>
            </div>
            <span className="badge badge-completed">5% commission</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '18px',
                background: 'rgba(73,250,132,0.08)',
                border: '1px solid rgba(73,250,132,0.16)'
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.56)', marginBottom: '6px' }}>Estimated earnings</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#49FA84' }}>{formatEtb(campaign.earnings)}</div>
            </div>
            <div
              style={{
                padding: '14px',
                borderRadius: '18px',
                background: 'rgba(47,212,255,0.08)',
                border: '1px solid rgba(47,212,255,0.16)'
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.56)', marginBottom: '6px' }}>Referral points</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#2FD4FF' }}>{formatNumber(campaign.points)}</div>
            </div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Top users leaderboard</h3>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '13px' }}>
              Only users with {formatNumber(campaign.minimumPrizeInvites)}+ invites qualify for Top 5 rewards
            </p>
          </div>
          {leaderboardEntries.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {leaderboardEntries.map((entry) => (
              <div
                key={`${entry.badge}-${entry.name}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      minWidth: '42px',
                      height: '42px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(73,250,132,0.14)',
                      color: '#49FA84',
                      fontWeight: 800
                    }}
                  >
                    {entry.badge}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{entry.name}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.56)' }}>{formatNumber(entry.invites)} invites</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#49FA84', fontWeight: 700 }}>{entry.reward}</div>
              </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '18px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.58)',
                textAlign: 'center'
              }}
            >
              No one has reached {formatNumber(campaign.minimumPrizeInvites)} invites yet.
            </div>
          )}
        </div>
      </motion.div>

      <motion.div {...sectionMotion(0.2)} style={{ display: 'grid', gap: '14px' }}>
        <div style={sectionCardStyle}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Referral history</h3>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '13px' }}>
              Track who joined using whose link
            </p>
          </div>
          {historyEntries.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {historyEntries.map((item) => (
              <div
                key={`${item.name}-${item.joinedAt}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.56)' }}>
                    Joined through {item.via}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.48)' }}>{item.joinedAt}</div>
                  <div style={{ color: '#49FA84', fontWeight: 700, marginTop: '5px', fontSize: '13px' }}>{item.status}</div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '18px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.58)',
                textAlign: 'center'
              }}
            >
              No referral joins have been recorded yet.
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Top 5 prizes</h3>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '13px' }}>
              Campaign rewards for inviters with {formatNumber(campaign.minimumPrizeInvites)}+ confirmed invites
            </p>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {campaign.prizes.map((prize) => (
              <div
                key={prize.place}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      minWidth: '42px',
                      height: '42px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(47,212,255,0.12)',
                      color: '#2FD4FF',
                      fontWeight: 800
                    }}
                  >
                    {prize.place}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{prize.title}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.56)' }}>{prize.reward}</div>
                  </div>
                </div>
                <i className="fas fa-trophy" style={{ color: '#FACC15', fontSize: '18px' }}></i>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReferralScreen;
