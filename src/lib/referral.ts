import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks if a referee user was referred by a referrer code.
 * If referee has an active subscription and referrer has not yet received
 * credit for this referee in `billing_adjustments`, awards 2L Free Milk (₹120 credit).
 */
export async function processPendingReferralReward(
  adminSupabase: SupabaseClient,
  refereeUserId: string
): Promise<{ success: boolean; awarded: boolean; rewardAmount?: number; referrerId?: string }> {
  try {
    // 1. Fetch referee profile
    const { data: refereeProfile, error: pErr } = await adminSupabase
      .from('profiles')
      .select('id, full_name, referral_code, referred_by_code')
      .eq('id', refereeUserId)
      .maybeSingle();

    if (pErr || !refereeProfile || !refereeProfile.referred_by_code) {
      return { success: true, awarded: false };
    }

    const refCode = refereeProfile.referred_by_code.trim().toUpperCase();

    // 2. Fetch referrer profile by referral_code
    const { data: referrerProfile } = await adminSupabase
      .from('profiles')
      .select('id')
      .ilike('referral_code', refCode)
      .maybeSingle();

    if (!referrerProfile || referrerProfile.id === refereeUserId) {
      return { success: true, awarded: false };
    }

    // 3. Verify referee actually has a subscription
    const { data: refereeSub } = await adminSupabase
      .from('subscriptions')
      .select('id')
      .eq('customer_id', refereeUserId)
      .maybeSingle();

    if (!refereeSub) {
      return { success: true, awarded: false };
    }

    // 4. Fetch referrer's subscription ID (billing_adjustments requires subscription_id NOT NULL)
    const { data: referrerSub } = await adminSupabase
      .from('subscriptions')
      .select('id')
      .eq('customer_id', referrerProfile.id)
      .maybeSingle();

    const subIdToUse = referrerSub?.id || refereeSub.id;

    // 5. Check if referrer ALREADY has a referral credit adjustment for this referee
    const refereeRefCode = refereeProfile.referral_code || refereeUserId;
    const { data: existingAdjs } = await adminSupabase
      .from('billing_adjustments')
      .select('id, description')
      .eq('customer_id', referrerProfile.id);

    const alreadyAwarded = (existingAdjs || []).some(adj =>
      adj.description?.includes(refereeRefCode) || adj.description?.includes(refereeUserId)
    );

    if (alreadyAwarded) {
      return { success: true, awarded: false };
    }

    // 6. Fetch current price per litre from system_settings
    const { data: priceSetting } = await adminSupabase
      .from('system_settings')
      .select('value')
      .eq('key', 'price_per_litre')
      .maybeSingle();

    const pricePerLitre = priceSetting?.value ? Number(priceSetting.value) : 60;
    const rewardLitres = 2.0;
    const rewardAmount = Math.round(rewardLitres * pricePerLitre * 100) / 100;

    // 7. Insert Carry-forward credit in billing_adjustments for Referrer
    // adjustment_type MUST be 'skip_credit' to satisfy Postgres check constraint 'billing_adjustments_adjustment_type_check'
    const descText = `Referral Reward: ${rewardLitres}L Free Milk (Friend ${refereeProfile.full_name || refereeRefCode} [${refereeRefCode}] subscribed)`;
    const { error: adjError } = await adminSupabase
      .from('billing_adjustments')
      .insert({
        subscription_id: subIdToUse,
        customer_id: referrerProfile.id,
        adjustment_type: 'skip_credit',
        amount: rewardAmount,
        description: descText,
        is_applied: false
      });

    if (adjError) {
      console.error('[processPendingReferralReward] Failed to insert billing_adjustment:', adjError.message);
      return { success: false, awarded: false };
    }

    console.log(`[Referral Reward Granted] Referrer (${referrerProfile.id}) awarded ₹${rewardAmount} credit for Referee ${refereeRefCode}`);

    // 8. Try updating referrals table if possible (ignoring permission errors)
    try {
      await adminSupabase
        .from('referrals')
        .upsert({
          referrer_id: referrerProfile.id,
          referee_id: refereeUserId,
          referral_code: refCode,
          status: 'completed',
          reward_litres: rewardLitres,
          reward_amount: rewardAmount,
          completed_at: new Date().toISOString()
        }, { onConflict: 'referee_id' });
    } catch (refErr) {
      // ignore referrals table permission errors
    }

    return {
      success: true,
      awarded: true,
      rewardAmount,
      referrerId: referrerProfile.id
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[processPendingReferralReward] Exception:', msg);
    return { success: false, awarded: false };
  }
}
