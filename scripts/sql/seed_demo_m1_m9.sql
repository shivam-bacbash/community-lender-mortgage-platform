-- ============================================================
-- Demo seed for milestones 1-9
-- Seeds all role accounts plus milestone tables used across:
-- auth, borrower portal, staff dashboard, AI, documents,
-- underwriting, pricing, communications, and compliance.
--
-- Notes:
-- - Safe to re-run in the same environment because seeded rows use
--   deterministic IDs or natural upserts where available.
-- - This seeds document metadata only. If you want signed previews to
--   work in the UI, upload matching files to the Supabase `documents`
--   bucket using the seeded storage paths.
-- ============================================================

do $seed$
declare
  seed_org_id uuid := '11111111-1111-1111-1111-111111111111';
  seed_branch_id uuid := '33333333-3333-3333-3333-333333333331';
  instance_uuid uuid := '00000000-0000-0000-0000-000000000000';
  seed_password text := 'Password123!';

  borrower_user_id uuid := '22222222-2222-2222-2222-222222222221';
  loan_officer_user_id uuid := '22222222-2222-2222-2222-222222222222';
  processor_user_id uuid := '22222222-2222-2222-2222-222222222223';
  underwriter_user_id uuid := '22222222-2222-2222-2222-222222222224';
  admin_user_id uuid := '22222222-2222-2222-2222-222222222225';

  loan_draft_id uuid := '44444444-4444-4444-4444-444444444441';
  loan_submitted_id uuid := '44444444-4444-4444-4444-444444444442';
  loan_processing_id uuid := '44444444-4444-4444-4444-444444444443';
  loan_underwriting_id uuid := '44444444-4444-4444-4444-444444444444';
  loan_approved_id uuid := '44444444-4444-4444-4444-444444444445';
  loan_ctc_id uuid := '44444444-4444-4444-4444-444444444446';
  loan_denied_id uuid := '44444444-4444-4444-4444-444444444447';

  bp_submitted_id uuid := '55555555-5555-5555-5555-555555555551';
  bp_processing_id uuid := '55555555-5555-5555-5555-555555555552';
  bp_underwriting_id uuid := '55555555-5555-5555-5555-555555555553';
  bp_approved_id uuid := '55555555-5555-5555-5555-555555555554';
  bp_ctc_id uuid := '55555555-5555-5555-5555-555555555555';
  bp_denied_id uuid := '55555555-5555-5555-5555-555555555556';

  property_draft_id uuid := '66666666-6666-6666-6666-666666666661';
  property_submitted_id uuid := '66666666-6666-6666-6666-666666666662';
  property_processing_id uuid := '66666666-6666-6666-6666-666666666663';
  property_underwriting_id uuid := '66666666-6666-6666-6666-666666666664';
  property_approved_id uuid := '66666666-6666-6666-6666-666666666665';
  property_ctc_id uuid := '66666666-6666-6666-6666-666666666666';
  property_denied_id uuid := '66666666-6666-6666-6666-666666666667';

  flood_cert_approved_id uuid := '66666666-6666-6666-6666-666666666671';
  flood_cert_ctc_id uuid := '66666666-6666-6666-6666-666666666672';
  appraisal_approved_id uuid := '66666666-6666-6666-6666-666666666681';
  appraisal_ctc_id uuid := '66666666-6666-6666-6666-666666666682';

  doc_underwriting_bank_statement_id uuid := '77777777-7777-7777-7777-777777777701';
  doc_underwriting_credit_auth_id uuid := '77777777-7777-7777-7777-777777777702';
  doc_underwriting_paystub_id uuid := '77777777-7777-7777-7777-777777777703';
  doc_approved_paystub_v1_id uuid := '77777777-7777-7777-7777-777777777704';
  doc_approved_paystub_v2_id uuid := '77777777-7777-7777-7777-777777777705';
  doc_approved_w2_id uuid := '77777777-7777-7777-7777-777777777706';
  doc_approved_bank_statement_id uuid := '77777777-7777-7777-7777-777777777707';
  doc_approved_photo_id_id uuid := '77777777-7777-7777-7777-777777777708';
  doc_approved_purchase_contract_id uuid := '77777777-7777-7777-7777-777777777709';
  doc_approved_appraisal_report_id uuid := '77777777-7777-7777-7777-777777777710';
  doc_approved_flood_cert_id uuid := '77777777-7777-7777-7777-777777777711';
  doc_approved_homeowners_insurance_id uuid := '77777777-7777-7777-7777-777777777712';
  doc_approved_le_v1_id uuid := '77777777-7777-7777-7777-777777777713';
  doc_approved_le_v2_id uuid := '77777777-7777-7777-7777-777777777714';
  doc_approved_cd_id uuid := '77777777-7777-7777-7777-777777777715';
  doc_ctc_title_commitment_id uuid := '77777777-7777-7777-7777-777777777716';
  doc_ctc_promissory_note_id uuid := '77777777-7777-7777-7777-777777777717';
  doc_ctc_deed_of_trust_id uuid := '77777777-7777-7777-7777-777777777718';
  doc_denied_photo_id_id uuid := '77777777-7777-7777-7777-777777777719';

  doc_request_underwriting_credit_auth_id uuid := '78888888-8888-8888-8888-888888888801';
  doc_request_approved_bank_statement_id uuid := '78888888-8888-8888-8888-888888888802';

  condition_underwriting_open_id uuid := '78999999-9999-9999-9999-999999999901';
  condition_approved_satisfied_id uuid := '78999999-9999-9999-9999-999999999902';
  condition_approved_open_id uuid := '78999999-9999-9999-9999-999999999903';
  condition_approved_internal_id uuid := '78999999-9999-9999-9999-999999999904';

  disclosure_le_v1_id uuid := '81111111-1111-1111-1111-111111111111';
  disclosure_le_v2_id uuid := '81111111-1111-1111-1111-111111111112';
  disclosure_cd_v1_id uuid := '81111111-1111-1111-1111-111111111113';
  hmda_denied_id uuid := '81111111-1111-1111-1111-111111111121';

  analytics_borrower_step_id uuid := '82222222-2222-2222-2222-222222222221';
  analytics_doc_upload_id uuid := '82222222-2222-2222-2222-222222222222';
  analytics_pipeline_view_id uuid := '82222222-2222-2222-2222-222222222223';
  analytics_ai_trigger_id uuid := '82222222-2222-2222-2222-222222222224';
  analytics_pricing_view_id uuid := '82222222-2222-2222-2222-222222222225';

  fraud_flag_underwriting_id uuid := '83333333-3333-3333-3333-333333333331';

  ai_submitted_prequal_id uuid := '84444444-4444-4444-4444-444444444441';
  ai_submitted_underwriting_id uuid := '84444444-4444-4444-4444-444444444442';
  ai_submitted_compliance_id uuid := '84444444-4444-4444-4444-444444444443';
  ai_underwriting_prequal_id uuid := '84444444-4444-4444-4444-444444444444';
  ai_underwriting_summary_id uuid := '84444444-4444-4444-4444-444444444445';
  ai_underwriting_compliance_id uuid := '84444444-4444-4444-4444-444444444446';
  ai_underwriting_risk_id uuid := '84444444-4444-4444-4444-444444444447';
  ai_approved_prequal_id uuid := '84444444-4444-4444-4444-444444444448';
  ai_approved_underwriting_id uuid := '84444444-4444-4444-4444-444444444449';
  ai_approved_compliance_id uuid := '84444444-4444-4444-4444-444444444450';
  ai_document_paystub_id uuid := '84444444-4444-4444-4444-444444444451';
  ai_document_bank_statement_id uuid := '84444444-4444-4444-4444-444444444452';
  ai_denied_prequal_id uuid := '84444444-4444-4444-4444-444444444453';
  ai_denied_underwriting_id uuid := '84444444-4444-4444-4444-444444444454';
  ai_denied_compliance_id uuid := '84444444-4444-4444-4444-444444444455';

  audit_loan_submitted_id uuid := '85555555-5555-5555-5555-555555555551';
  audit_doc_requested_id uuid := '85555555-5555-5555-5555-555555555552';
  audit_doc_accepted_id uuid := '85555555-5555-5555-5555-555555555553';
  audit_condition_added_id uuid := '85555555-5555-5555-5555-555555555554';
  audit_task_created_id uuid := '85555555-5555-5555-5555-555555555555';
  audit_task_completed_id uuid := '85555555-5555-5555-5555-555555555556';
  audit_underwriting_decision_id uuid := '85555555-5555-5555-5555-555555555557';
  audit_rate_lock_id uuid := '85555555-5555-5555-5555-555555555558';
  audit_disclosure_issue_id uuid := '85555555-5555-5555-5555-555555555559';
  audit_message_sent_id uuid := '85555555-5555-5555-5555-555555555560';
  audit_pipeline_move_id uuid := '85555555-5555-5555-5555-555555555561';
  audit_hmda_capture_id uuid := '85555555-5555-5555-5555-555555555562';

  notification_borrower_doc_req_id uuid := '86666666-6666-6666-6666-666666666661';
  notification_borrower_condition_id uuid := '86666666-6666-6666-6666-666666666662';
  notification_borrower_status_id uuid := '86666666-6666-6666-6666-666666666663';
  notification_lo_message_id uuid := '86666666-6666-6666-6666-666666666664';
  notification_lo_rate_lock_id uuid := '86666666-6666-6666-6666-666666666665';
  notification_lo_task_id uuid := '86666666-6666-6666-6666-666666666666';
  notification_processor_task_id uuid := '86666666-6666-6666-6666-666666666667';
  notification_underwriter_task_id uuid := '86666666-6666-6666-6666-666666666668';
  notification_admin_disclosure_id uuid := '86666666-6666-6666-6666-666666666669';

  message_borrower_id uuid := '87777777-7777-7777-7777-777777777771';
  message_lo_reply_id uuid := '87777777-7777-7777-7777-777777777772';
  message_processor_internal_id uuid := '87777777-7777-7777-7777-777777777773';
  message_underwriter_id uuid := '87777777-7777-7777-7777-777777777774';

  task_borrower_doc_collection_id uuid := '88888888-8888-8888-8888-888888888881';
  task_lo_followup_id uuid := '88888888-8888-8888-8888-888888888882';
  task_processor_disclosure_id uuid := '88888888-8888-8888-8888-888888888883';
  task_underwriter_review_id uuid := '88888888-8888-8888-8888-888888888884';

  uw_decision_approved_id uuid := '89999999-9999-9999-9999-999999999991';
  uw_decision_denied_id uuid := '89999999-9999-9999-9999-999999999992';

  conventional_product_id uuid := '99999999-9999-9999-9999-999999999901';
  fha_product_id uuid := '99999999-9999-9999-9999-999999999902';
  va_product_id uuid := '99999999-9999-9999-9999-999999999903';
  usda_product_id uuid := '99999999-9999-9999-9999-999999999904';
  jumbo_product_id uuid := '99999999-9999-9999-9999-999999999905';
  conventional_rate_sheet_id uuid := '99999999-9999-9999-9999-999999999911';
  fha_rate_sheet_id uuid := '99999999-9999-9999-9999-999999999912';
  va_rate_sheet_id uuid := '99999999-9999-9999-9999-999999999913';
  usda_rate_sheet_id uuid := '99999999-9999-9999-9999-999999999914';
  jumbo_rate_sheet_id uuid := '99999999-9999-9999-9999-999999999915';
  rate_lock_approved_id uuid := '99999999-9999-9999-9999-999999999921';

  stage_application_id uuid;
  stage_processing_id uuid;
  stage_underwriting_id uuid;
  stage_approved_id uuid;
  stage_ctc_id uuid;
  stage_denied_id uuid;

  seed_user record;
  resolved_user_id uuid;
  product_rec record;
  rule_rec record;
  template_rec record;
  stage_rec record;
  rate_matrix jsonb;
  submitted_today_at timestamptz := date_trunc('day', now()) + interval '10 hours';
  processing_updated_at timestamptz := date_trunc('day', now()) - interval '2 days' + interval '14 hours';
  underwriting_updated_at timestamptz := date_trunc('day', now()) - interval '1 day' + interval '16 hours';
  approved_at_ts timestamptz := date_trunc('day', now()) - interval '1 day' + interval '11 hours';
  ctc_updated_at timestamptz := date_trunc('day', now()) + interval '9 hours';
  denied_at_ts timestamptz := date_trunc('day', now()) - interval '3 days' + interval '15 hours';
begin
  insert into public.organizations (
    id,
    name,
    slug,
    plan,
    is_active,
    brand_colors,
    settings
  )
  values (
    seed_org_id,
    'First Community Bank',
    'first-community-bank',
    'pro',
    true,
    '{"primary":"#0f4c81","secondary":"#7c9e2a","accent":"#f4b942"}'::jsonb,
    '{"demo_mode":true,"milestones_seeded":["M1","M2","M3","M4","M5","M6","M7","M8","M9"]}'::jsonb
  )
  on conflict (id) do update
  set
    name = excluded.name,
    slug = excluded.slug,
    plan = excluded.plan,
    is_active = excluded.is_active,
    brand_colors = excluded.brand_colors,
    settings = excluded.settings,
    deleted_at = null,
    updated_at = now();

  for seed_user in
    select *
    from (
      values
        (borrower_user_id, 'borrower.demo@nexuslend.local', 'borrower', 'Taylor', 'Borrower', '+15550000001'),
        (loan_officer_user_id, 'loan.officer.demo@nexuslend.local', 'loan_officer', 'Jordan', 'Lopez', '+15550000002'),
        (processor_user_id, 'processor.demo@nexuslend.local', 'processor', 'Casey', 'Nguyen', '+15550000003'),
        (underwriter_user_id, 'underwriter.demo@nexuslend.local', 'underwriter', 'Morgan', 'Shaw', '+15550000004'),
        (admin_user_id, 'admin.demo@nexuslend.local', 'admin', 'Riley', 'Chen', '+15550000005')
    ) as t(id, email, role, first_name, last_name, phone)
  loop
    select id
    into resolved_user_id
    from auth.users
    where email = seed_user.email
      and is_sso_user = false
    limit 1;

    if resolved_user_id is null then
      resolved_user_id := seed_user.id;

      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        email_change_confirm_status,
        is_sso_user,
        is_anonymous
      )
      values (
        instance_uuid,
        resolved_user_id,
        'authenticated',
        'authenticated',
        seed_user.email,
        crypt(seed_password, gen_salt('bf')),
        now(),
        '',
        '',
        '',
        '',
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object(
          'first_name', seed_user.first_name,
          'last_name', seed_user.last_name,
          'role', seed_user.role
        ),
        now(),
        now(),
        seed_user.phone,
        now(),
        0,
        false,
        false
      );
    else
      update auth.users
      set
        encrypted_password = crypt(seed_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        confirmation_token = '',
        email_change = '',
        email_change_token_new = '',
        recovery_token = '',
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
        raw_user_meta_data = jsonb_build_object(
          'first_name', seed_user.first_name,
          'last_name', seed_user.last_name,
          'role', seed_user.role
        ),
        phone = seed_user.phone,
        phone_confirmed_at = now(),
        deleted_at = null,
        is_sso_user = false,
        is_anonymous = false,
        updated_at = now()
      where id = resolved_user_id;
    end if;

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      resolved_user_id,
      jsonb_build_object(
        'sub', resolved_user_id::text,
        'email', seed_user.email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      seed_user.email,
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do update
    set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      last_sign_in_at = excluded.last_sign_in_at,
      updated_at = excluded.updated_at;

    insert into public.profiles (
      id,
      organization_id,
      role,
      first_name,
      last_name,
      phone,
      is_active
    )
    values (
      resolved_user_id,
      seed_org_id,
      seed_user.role,
      seed_user.first_name,
      seed_user.last_name,
      seed_user.phone,
      true
    )
    on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      role = excluded.role,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      phone = excluded.phone,
      is_active = excluded.is_active,
      deleted_at = null,
      updated_at = now();
  end loop;

  update public.profiles
  set
    nmls_id = '1832045',
    license_states = array['CA', 'AZ', 'NV']
  where id = loan_officer_user_id;

  update public.profiles
  set
    nmls_id = '1832991',
    license_states = array['CA']
  where id = admin_user_id;

  perform set_config('request.jwt.claim.sub', admin_user_id::text, true);

  insert into public.branches (
    id,
    organization_id,
    name,
    nmls_id,
    address,
    phone,
    manager_id,
    is_active
  )
  values (
    seed_branch_id,
    seed_org_id,
    'Downtown Lending Center',
    'NMLS-DC-1001',
    '{"street":"120 Market Street","city":"San Jose","state":"CA","zip":"95113"}'::jsonb,
    '+14085550100',
    loan_officer_user_id,
    true
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    name = excluded.name,
    nmls_id = excluded.nmls_id,
    address = excluded.address,
    phone = excluded.phone,
    manager_id = excluded.manager_id,
    is_active = excluded.is_active,
    deleted_at = null,
    updated_at = now();

  insert into public.branch_members (branch_id, profile_id, is_primary)
  values
    (seed_branch_id, loan_officer_user_id, true),
    (seed_branch_id, processor_user_id, true),
    (seed_branch_id, underwriter_user_id, true),
    (seed_branch_id, admin_user_id, true)
  on conflict (branch_id, profile_id) do update
  set
    is_primary = excluded.is_primary,
    deleted_at = null,
    updated_at = now();

  for stage_rec in
    select *
    from (
      values
        ('Application', 1, '#6366f1', 'New and submitted applications.', false, null::text, 2),
        ('Processing', 2, '#f59e0b', 'Document collection and verification.', false, null::text, 7),
        ('Underwriting', 3, '#3b82f6', 'Underwriter review and decisioning.', false, null::text, 10),
        ('Approved', 4, '#10b981', 'Approved and working conditions.', false, null::text, 5),
        ('Clear to Close', 5, '#14b8a6', 'Ready for final disclosure and closing.', false, null::text, 3),
        ('Funded', 6, '#22c55e', 'Loan has funded.', true, 'funded', null),
        ('Denied', 7, '#ef4444', 'Application was denied.', true, 'denied', null),
        ('Withdrawn', 8, '#9ca3af', 'Application withdrawn by borrower.', true, 'withdrawn', null)
    ) as t(name, order_index, color, description, is_terminal, terminal_outcome, sla_days)
  loop
    insert into public.pipeline_stages (
      organization_id,
      name,
      order_index,
      color,
      description,
      is_terminal,
      terminal_outcome,
      sla_days
    )
    values (
      seed_org_id,
      stage_rec.name,
      stage_rec.order_index,
      stage_rec.color,
      stage_rec.description,
      stage_rec.is_terminal,
      stage_rec.terminal_outcome,
      stage_rec.sla_days
    )
    on conflict (organization_id, order_index) do update
    set
      name = excluded.name,
      color = excluded.color,
      description = excluded.description,
      is_terminal = excluded.is_terminal,
      terminal_outcome = excluded.terminal_outcome,
      sla_days = excluded.sla_days,
      deleted_at = null,
      updated_at = now();
  end loop;

  select id into stage_application_id from public.pipeline_stages where organization_id = seed_org_id and name = 'Application' limit 1;
  select id into stage_processing_id from public.pipeline_stages where organization_id = seed_org_id and name = 'Processing' limit 1;
  select id into stage_underwriting_id from public.pipeline_stages where organization_id = seed_org_id and name = 'Underwriting' limit 1;
  select id into stage_approved_id from public.pipeline_stages where organization_id = seed_org_id and name = 'Approved' limit 1;
  select id into stage_ctc_id from public.pipeline_stages where organization_id = seed_org_id and name = 'Clear to Close' limit 1;
  select id into stage_denied_id from public.pipeline_stages where organization_id = seed_org_id and name = 'Denied' limit 1;

  for rule_rec in
    select *
    from (
      values
        ('conventional', 'min_credit_score', '{"min":620}'::jsonb, 10, 'Minimum representative credit score for conventional loans.'),
        ('conventional', 'max_dti', '{"max":0.45}'::jsonb, 20, 'Maximum debt-to-income ratio for conventional loans.'),
        ('conventional', 'max_ltv', '{"max":0.97}'::jsonb, 30, 'Maximum loan-to-value ratio for conventional loans.'),
        ('conventional', 'min_months_reserves', '{"min":2}'::jsonb, 40, 'Minimum post-closing reserves for conventional loans.'),
        ('fha', 'min_credit_score', '{"min":580}'::jsonb, 10, 'Minimum representative credit score for FHA loans.'),
        ('fha', 'max_dti', '{"max":0.57}'::jsonb, 20, 'Maximum debt-to-income ratio for FHA loans.'),
        ('fha', 'max_ltv', '{"max":0.965}'::jsonb, 30, 'Maximum loan-to-value ratio for FHA loans.'),
        ('va', 'min_credit_score', '{"min":620}'::jsonb, 10, 'Minimum representative credit score for VA loans.'),
        ('va', 'max_dti', '{"max":0.50}'::jsonb, 20, 'Maximum debt-to-income ratio for VA loans.'),
        ('va', 'min_months_reserves', '{"min":2}'::jsonb, 30, 'Minimum reserves guideline for VA loans.'),
        ('usda', 'min_credit_score', '{"min":640}'::jsonb, 10, 'Minimum representative credit score for USDA loans.'),
        ('usda', 'max_dti', '{"max":0.41}'::jsonb, 20, 'Maximum debt-to-income ratio for USDA loans.'),
        ('jumbo', 'min_credit_score', '{"min":700}'::jsonb, 10, 'Minimum representative credit score for jumbo loans.'),
        ('jumbo', 'max_dti', '{"max":0.43}'::jsonb, 20, 'Maximum debt-to-income ratio for jumbo loans.'),
        ('jumbo', 'max_ltv', '{"max":0.80}'::jsonb, 30, 'Maximum loan-to-value ratio for jumbo loans.'),
        ('jumbo', 'min_months_reserves', '{"min":6}'::jsonb, 40, 'Minimum reserves guideline for jumbo loans.'),
        ('all', 'max_loan_amount', '{"max":1500000}'::jsonb, 999, 'Absolute maximum loan amount for the lending platform.')
    ) as t(loan_type, rule_name, rule_config, priority, description)
  loop
    insert into public.underwriting_rules (
      organization_id,
      loan_type,
      rule_name,
      rule_config,
      is_active,
      priority,
      description
    )
    values (
      seed_org_id,
      rule_rec.loan_type,
      rule_rec.rule_name,
      rule_rec.rule_config,
      true,
      rule_rec.priority,
      rule_rec.description
    )
    on conflict (organization_id, loan_type, rule_name) do update
    set
      rule_config = excluded.rule_config,
      is_active = excluded.is_active,
      priority = excluded.priority,
      description = excluded.description,
      deleted_at = null,
      updated_at = now();
  end loop;

  for template_rec in
    select *
    from (
      values
        ('application_submitted', 'We received your application - {{loan_number}}', '<p>Hi {{borrower_name}},</p><p>Your mortgage application {{loan_number}} has been received and is being reviewed.</p><p>Your loan officer {{lo_name}} will be in touch shortly.</p><p><a href="{{portal_url}}">Open your borrower portal</a></p>', 'Hi {{borrower_name}}, your mortgage application {{loan_number}} has been received and is being reviewed. Your loan officer {{lo_name}} will be in touch shortly. Track it at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"lo_name"},{"key":"portal_url"}]'::jsonb),
        ('status_changed', 'Loan update - {{loan_number}} is now {{loan_status}}', '<p>Hi {{borrower_name}},</p><p>Your loan {{loan_number}} is now <strong>{{loan_status}}</strong>.</p><p><a href="{{portal_url}}">View the latest status</a></p>', 'Hi {{borrower_name}}, your loan {{loan_number}} is now {{loan_status}}. View the latest status at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"loan_status"},{"key":"portal_url"}]'::jsonb),
        ('document_requested', 'Document needed for {{loan_number}}', '<p>Hi {{borrower_name}},</p><p>We need {{document_type}} for loan {{loan_number}}.</p><p>{{request_message}}</p><p><a href="{{portal_url}}">Upload documents</a></p>', 'Hi {{borrower_name}}, we need {{document_type}} for loan {{loan_number}}. {{request_message}} Upload it at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"document_type"},{"key":"request_message"},{"key":"portal_url"}]'::jsonb),
        ('document_accepted', 'Document accepted for {{loan_number}}', '<p>Hi {{borrower_name}},</p><p>Your {{document_type}} for loan {{loan_number}} has been accepted.</p><p><a href="{{portal_url}}">Review your file</a></p>', 'Hi {{borrower_name}}, your {{document_type}} for loan {{loan_number}} has been accepted. Review your file at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"document_type"},{"key":"portal_url"}]'::jsonb),
        ('loan_approved', 'Great news - your loan has been approved!', '<p>Hi {{borrower_name}},</p><p>Congratulations. Your loan {{loan_number}} has been approved for {{loan_amount}}.</p><p><a href="{{portal_url}}">View next steps</a></p>', 'Hi {{borrower_name}}, congratulations. Your loan {{loan_number}} has been approved for {{loan_amount}}. View next steps at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"loan_amount"},{"key":"portal_url"}]'::jsonb),
        ('loan_denied', 'Update on your loan application - {{loan_number}}', '<p>Hi {{borrower_name}},</p><p>Your loan {{loan_number}} was not approved.</p><p><a href="{{portal_url}}">Review the latest update</a></p>', 'Hi {{borrower_name}}, your loan {{loan_number}} was not approved. Review the latest update at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"portal_url"}]'::jsonb),
        ('rate_lock_expiring', 'Rate lock expiring soon - {{loan_number}}', '<p>Hi {{lo_name}},</p><p>The rate lock for {{borrower_name}} on loan {{loan_number}} expires on {{lock_expiration_date}}.</p><p><a href="{{portal_url}}">Open pricing</a></p>', 'Hi {{lo_name}}, the rate lock for {{borrower_name}} on loan {{loan_number}} expires on {{lock_expiration_date}}. Open pricing at {{portal_url}}.', '[{"key":"lo_name"},{"key":"borrower_name"},{"key":"loan_number"},{"key":"lock_expiration_date"},{"key":"portal_url"}]'::jsonb),
        ('task_assigned', 'New task assigned - {{task_title}}', '<p>Hi {{assignee_name}},</p><p>You have a new task for loan {{loan_number}}: {{task_title}}.</p><p><a href="{{portal_url}}">Open the file</a></p>', 'Hi {{assignee_name}}, you have a new task for loan {{loan_number}}: {{task_title}}. Open the file at {{portal_url}}.', '[{"key":"assignee_name"},{"key":"loan_number"},{"key":"task_title"},{"key":"portal_url"}]'::jsonb),
        ('condition_added', 'New condition for {{loan_number}}', '<p>Hi {{borrower_name}},</p><p>A new condition was added to loan {{loan_number}}: {{condition_description}}.</p><p><a href="{{portal_url}}">Review conditions</a></p>', 'Hi {{borrower_name}}, a new condition was added to loan {{loan_number}}: {{condition_description}}. Review conditions at {{portal_url}}.', '[{"key":"borrower_name"},{"key":"loan_number"},{"key":"condition_description"},{"key":"portal_url"}]'::jsonb)
    ) as t(trigger_event, subject, body_html, body_text, variables)
  loop
    insert into public.email_templates (
      organization_id,
      trigger_event,
      subject,
      body_html,
      body_text,
      reply_to,
      variables,
      is_active,
      is_default
    )
    values (
      seed_org_id,
      template_rec.trigger_event,
      template_rec.subject,
      template_rec.body_html,
      template_rec.body_text,
      null,
      template_rec.variables,
      true,
      true
    )
    on conflict (organization_id, trigger_event) do update
    set
      subject = excluded.subject,
      body_html = excluded.body_html,
      body_text = excluded.body_text,
      reply_to = excluded.reply_to,
      variables = excluded.variables,
      is_active = excluded.is_active,
      is_default = excluded.is_default,
      deleted_at = null,
      updated_at = now();
  end loop;

  for product_rec in
    select *
    from (
      values
        (conventional_product_id, conventional_rate_sheet_id, '30 Year Fixed Conventional', 'conventional', 360, 'fixed', null::integer, '{"min_credit_score":620,"max_dti":0.45,"max_ltv":0.97,"min_loan_amount":75000,"max_loan_amount":766550}'::jsonb, 'Standard conforming fixed-rate product for primary residences.', 10, 6.625::numeric, 0.125::numeric),
        (fha_product_id, fha_rate_sheet_id, '30 Year Fixed FHA', 'fha', 360, 'fixed', null::integer, '{"min_credit_score":580,"max_dti":0.57,"max_ltv":0.965,"min_loan_amount":50000,"max_loan_amount":766550}'::jsonb, 'Government-insured fixed-rate product with flexible credit overlays.', 20, 6.500::numeric, 0.150::numeric),
        (va_product_id, va_rate_sheet_id, '30 Year Fixed VA', 'va', 360, 'fixed', null::integer, '{"min_credit_score":620,"max_dti":0.50,"min_loan_amount":50000,"max_loan_amount":1200000}'::jsonb, 'Veteran-focused fixed-rate product with competitive pricing.', 30, 6.375::numeric, 0.120::numeric),
        (usda_product_id, usda_rate_sheet_id, '30 Year Fixed USDA', 'usda', 360, 'fixed', null::integer, '{"min_credit_score":640,"max_dti":0.41,"min_loan_amount":50000,"max_loan_amount":650000}'::jsonb, 'Rural housing fixed-rate product with conservative eligibility caps.', 40, 6.750::numeric, 0.170::numeric),
        (jumbo_product_id, jumbo_rate_sheet_id, '30 Year Fixed Jumbo', 'jumbo', 360, 'fixed', null::integer, '{"min_credit_score":700,"max_dti":0.43,"max_ltv":0.80,"min_loan_amount":766551,"max_loan_amount":2500000}'::jsonb, 'Portfolio jumbo product for higher-balance fixed-rate loans.', 50, 7.000::numeric, 0.200::numeric)
    ) as t(product_id, rate_sheet_id, name, loan_type, term_months, amortization_type, arm_initial_period, guidelines, description, display_order, base_rate, margin)
  loop
    insert into public.loan_products (
      id,
      organization_id,
      name,
      loan_type,
      term_months,
      amortization_type,
      arm_initial_period,
      guidelines,
      description,
      is_active,
      display_order
    )
    values (
      product_rec.product_id,
      seed_org_id,
      product_rec.name,
      product_rec.loan_type,
      product_rec.term_months,
      product_rec.amortization_type,
      product_rec.arm_initial_period,
      product_rec.guidelines,
      product_rec.description,
      true,
      product_rec.display_order
    )
    on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      name = excluded.name,
      loan_type = excluded.loan_type,
      term_months = excluded.term_months,
      amortization_type = excluded.amortization_type,
      arm_initial_period = excluded.arm_initial_period,
      guidelines = excluded.guidelines,
      description = excluded.description,
      is_active = excluded.is_active,
      display_order = excluded.display_order,
      deleted_at = null,
      updated_at = now();

    select jsonb_object_agg(
      format('ltv_%s_fico_%s', ltv_bucket, fico_bucket),
      jsonb_build_object(
        'rate',
        round((
          product_rec.base_rate
          + greatest(0, (ltv_bucket - 80)::numeric / 5) * 0.125
          + greatest(0, (760 - fico_bucket)::numeric / 20) * 0.0625
        )::numeric, 3),
        'points',
        greatest(
          0,
          round((
            (
              greatest(0, (ltv_bucket - 80)::numeric / 5) * 0.125
              + greatest(0, (760 - fico_bucket)::numeric / 20) * 0.0625
            ) * 2
          )::numeric, 3)
        )
      )
    )
    into rate_matrix
    from unnest(array[80, 85, 90, 95, 97]) as ltv_bucket
    cross join unnest(array[620, 680, 720, 740, 760]) as fico_bucket;

    insert into public.rate_sheets (
      id,
      organization_id,
      loan_product_id,
      effective_date,
      expiry_date,
      rate_data,
      margin,
      is_active
    )
    values (
      product_rec.rate_sheet_id,
      seed_org_id,
      product_rec.product_id,
      current_date,
      null,
      rate_matrix,
      product_rec.margin,
      true
    )
    on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      loan_product_id = excluded.loan_product_id,
      effective_date = excluded.effective_date,
      expiry_date = excluded.expiry_date,
      rate_data = excluded.rate_data,
      margin = excluded.margin,
      is_active = excluded.is_active,
      deleted_at = null,
      updated_at = now();
  end loop;

  insert into public.loan_applications (
    id, organization_id, loan_number, borrower_id, loan_officer_id, processor_id, underwriter_id, branch_id,
    pipeline_stage_id, status, loan_purpose, loan_type, loan_amount, down_payment, term_months,
    submitted_at, approved_at, denied_at, estimated_closing, metadata, created_at, updated_at
  )
  values
    (loan_draft_id, seed_org_id, 'LN-2026-10001', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_application_id, 'draft', 'purchase', 'conventional', 425000, 85000, 360,
      null, null, null, null, '{"demo_state":"draft_step_1_complete"}'::jsonb, now() - interval '6 days', now() - interval '3 hours'),
    (loan_submitted_id, seed_org_id, 'LN-2026-10002', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_application_id, 'submitted', 'purchase', 'fha', 315000, 18000, 360,
      submitted_today_at, null, null, current_date + 21, '{"demo_state":"borrower_submitted_today"}'::jsonb, now() - interval '2 days', submitted_today_at),
    (loan_processing_id, seed_org_id, 'LN-2026-10003', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_processing_id, 'processing', 'refinance', 'va', 280000, 0, 360,
      now() - interval '7 days', null, null, current_date + 14, '{"demo_state":"processor_working_file"}'::jsonb, now() - interval '8 days', processing_updated_at),
    (loan_underwriting_id, seed_org_id, 'LN-2026-10004', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_underwriting_id, 'underwriting', 'purchase', 'conventional', 410000, 90000, 360,
      now() - interval '6 days', null, null, current_date + 10, '{"demo_state":"uw_with_open_conditions"}'::jsonb, now() - interval '7 days', underwriting_updated_at),
    (loan_approved_id, seed_org_id, 'LN-2026-10005', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_approved_id, 'approved', 'purchase', 'conventional', 360000, 95000, 360,
      now() - interval '12 days', approved_at_ts, null, current_date + 5, '{"demo_state":"approved_with_lock_and_disclosures"}'::jsonb, now() - interval '13 days', approved_at_ts),
    (loan_ctc_id, seed_org_id, 'LN-2026-10006', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_ctc_id, 'clear_to_close', 'purchase', 'jumbo', 865000, 325000, 360,
      now() - interval '18 days', now() - interval '4 days', null, current_date + 2, '{"demo_state":"clear_to_close"}'::jsonb, now() - interval '19 days', ctc_updated_at),
    (loan_denied_id, seed_org_id, 'LN-2026-10007', borrower_user_id, loan_officer_user_id, processor_user_id, underwriter_user_id, seed_branch_id,
      stage_denied_id, 'denied', 'purchase', 'usda', 265000, 12000, 360,
      now() - interval '10 days', null, denied_at_ts, null, '{"demo_state":"hmda_terminal_file"}'::jsonb, now() - interval '11 days', denied_at_ts)
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    loan_number = excluded.loan_number,
    borrower_id = excluded.borrower_id,
    loan_officer_id = excluded.loan_officer_id,
    processor_id = excluded.processor_id,
    underwriter_id = excluded.underwriter_id,
    branch_id = excluded.branch_id,
    pipeline_stage_id = excluded.pipeline_stage_id,
    status = excluded.status,
    loan_purpose = excluded.loan_purpose,
    loan_type = excluded.loan_type,
    loan_amount = excluded.loan_amount,
    down_payment = excluded.down_payment,
    term_months = excluded.term_months,
    submitted_at = excluded.submitted_at,
    approved_at = excluded.approved_at,
    denied_at = excluded.denied_at,
    estimated_closing = excluded.estimated_closing,
    metadata = excluded.metadata,
    deleted_at = null,
    updated_at = excluded.updated_at;

  insert into public.borrower_profiles (
    id, profile_id, loan_application_id, ssn_encrypted, dob, marital_status, dependents_count, citizenship,
    address_current, years_at_address, housing_status, monthly_housing_payment, declarations
  )
  values
    (bp_submitted_id, borrower_user_id, loan_submitted_id, 'seeded-demo-ssn-10002', '1991-04-12', 'married', 1, 'us_citizen',
      '{"street":"441 Willow Glen Way","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara"}'::jsonb, 4.5, 'rent', 2450,
      '{"bankruptcy":false,"foreclosure":false,"lawsuits":false,"obligated_on_loan":false}'::jsonb),
    (bp_processing_id, borrower_user_id, loan_processing_id, 'seeded-demo-ssn-10003', '1991-04-12', 'married', 1, 'us_citizen',
      '{"street":"441 Willow Glen Way","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara"}'::jsonb, 4.5, 'rent', 2450,
      '{"bankruptcy":false,"foreclosure":false,"lawsuits":false,"obligated_on_loan":false}'::jsonb),
    (bp_underwriting_id, borrower_user_id, loan_underwriting_id, 'seeded-demo-ssn-10004', '1991-04-12', 'married', 1, 'us_citizen',
      '{"street":"441 Willow Glen Way","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara"}'::jsonb, 4.5, 'rent', 2450,
      '{"bankruptcy":false,"foreclosure":false,"lawsuits":false,"obligated_on_loan":false}'::jsonb),
    (bp_approved_id, borrower_user_id, loan_approved_id, 'seeded-demo-ssn-10005', '1991-04-12', 'married', 1, 'us_citizen',
      '{"street":"441 Willow Glen Way","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara"}'::jsonb, 4.5, 'rent', 2450,
      '{"bankruptcy":false,"foreclosure":false,"lawsuits":false,"obligated_on_loan":false}'::jsonb),
    (bp_ctc_id, borrower_user_id, loan_ctc_id, 'seeded-demo-ssn-10006', '1991-04-12', 'married', 1, 'us_citizen',
      '{"street":"441 Willow Glen Way","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara"}'::jsonb, 4.5, 'rent', 2450,
      '{"bankruptcy":false,"foreclosure":false,"lawsuits":false,"obligated_on_loan":false}'::jsonb),
    (bp_denied_id, borrower_user_id, loan_denied_id, 'seeded-demo-ssn-10007', '1991-04-12', 'married', 1, 'us_citizen',
      '{"street":"441 Willow Glen Way","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara"}'::jsonb, 4.5, 'rent', 2450,
      '{"bankruptcy":false,"foreclosure":false,"lawsuits":false,"obligated_on_loan":false}'::jsonb)
  on conflict (id) do update
  set
    profile_id = excluded.profile_id,
    loan_application_id = excluded.loan_application_id,
    ssn_encrypted = excluded.ssn_encrypted,
    dob = excluded.dob,
    marital_status = excluded.marital_status,
    dependents_count = excluded.dependents_count,
    citizenship = excluded.citizenship,
    address_current = excluded.address_current,
    years_at_address = excluded.years_at_address,
    housing_status = excluded.housing_status,
    monthly_housing_payment = excluded.monthly_housing_payment,
    declarations = excluded.declarations,
    deleted_at = null,
    updated_at = now();

  insert into public.employment_records (
    id, borrower_profile_id, employer_name, employer_address, employer_phone, position, employment_type,
    start_date, end_date, is_current, is_primary, base_monthly_income, overtime_monthly, bonus_monthly, commission_monthly, other_monthly, verified_at, verified_via
  )
  values
    ('55555555-5555-5555-5555-555555555601', bp_submitted_id, 'Redwood Health Systems', '{"street":"88 Alameda Blvd","city":"San Jose","state":"CA","zip":"95110"}'::jsonb, '+14085550111', 'Operations Manager', 'w2',
      '2019-03-01', null, true, true, 7200, 450, 250, 0, 0, now() - interval '20 days', 'manual'),
    ('55555555-5555-5555-5555-555555555602', bp_processing_id, 'Civic Utilities', '{"street":"200 Capitol Avenue","city":"Sacramento","state":"CA","zip":"95814"}'::jsonb, '+19165550112', 'Program Analyst', 'w2',
      '2018-01-15', null, true, true, 7800, 0, 0, 0, 0, now() - interval '35 days', 'voe'),
    ('55555555-5555-5555-5555-555555555603', bp_underwriting_id, 'Atlas Medical Group', '{"street":"190 North 1st Street","city":"San Jose","state":"CA","zip":"95113"}'::jsonb, '+14085550113', 'Clinic Director', 'w2',
      '2017-06-01', null, true, true, 9100, 200, 0, 0, 0, now() - interval '10 days', 'paystub'),
    ('55555555-5555-5555-5555-555555555604', bp_approved_id, 'Summit BioLabs', '{"street":"501 Mission Street","city":"San Francisco","state":"CA","zip":"94105"}'::jsonb, '+14155550114', 'Finance Lead', 'w2',
      '2016-05-01', null, true, true, 10800, 450, 350, 0, 0, now() - interval '8 days', 'paystub'),
    ('55555555-5555-5555-5555-555555555605', bp_ctc_id, 'Northstar Ventures', '{"street":"250 Howard Street","city":"San Francisco","state":"CA","zip":"94105"}'::jsonb, '+14155550115', 'Product Executive', 'w2',
      '2015-08-15', null, true, true, 18500, 0, 1500, 0, 0, now() - interval '9 days', 'manual'),
    ('55555555-5555-5555-5555-555555555606', bp_denied_id, 'Bay Area Foods', '{"street":"712 Story Road","city":"San Jose","state":"CA","zip":"95122"}'::jsonb, '+14085550116', 'Shift Supervisor', 'w2',
      '2024-01-10', null, true, true, 4200, 0, 0, 0, 0, now() - interval '40 days', 'manual')
  on conflict (id) do update
  set
    borrower_profile_id = excluded.borrower_profile_id,
    employer_name = excluded.employer_name,
    employer_address = excluded.employer_address,
    employer_phone = excluded.employer_phone,
    position = excluded.position,
    employment_type = excluded.employment_type,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    is_current = excluded.is_current,
    is_primary = excluded.is_primary,
    base_monthly_income = excluded.base_monthly_income,
    overtime_monthly = excluded.overtime_monthly,
    bonus_monthly = excluded.bonus_monthly,
    commission_monthly = excluded.commission_monthly,
    other_monthly = excluded.other_monthly,
    verified_at = excluded.verified_at,
    verified_via = excluded.verified_via,
    deleted_at = null,
    updated_at = now();

  insert into public.assets (
    id, borrower_profile_id, asset_type, institution_name, account_last4, balance, is_gift, gift_source, verified_via, verified_at
  )
  values
    ('55555555-5555-5555-5555-555555555701', bp_submitted_id, 'checking', 'First Community Checking', '1024', 21450, false, null, 'statement', now() - interval '15 days'),
    ('55555555-5555-5555-5555-555555555702', bp_submitted_id, 'gift', 'Family Gift', null, 12000, true, 'family', 'manual', now() - interval '12 days'),
    ('55555555-5555-5555-5555-555555555703', bp_processing_id, 'savings', 'Patriot Credit Union', '5510', 46800, false, null, 'statement', now() - interval '18 days'),
    ('55555555-5555-5555-5555-555555555704', bp_underwriting_id, 'checking', 'Community One Bank', '2241', 38500, false, null, 'statement', now() - interval '7 days'),
    ('55555555-5555-5555-5555-555555555705', bp_underwriting_id, '401k', 'Fidelity', '4419', 28200, false, null, 'manual', now() - interval '30 days'),
    ('55555555-5555-5555-5555-555555555706', bp_approved_id, 'checking', 'Community One Bank', '7784', 42200, false, null, 'statement', now() - interval '5 days'),
    ('55555555-5555-5555-5555-555555555707', bp_approved_id, 'savings', 'Community One Bank', '9901', 28600, false, null, 'statement', now() - interval '5 days'),
    ('55555555-5555-5555-5555-555555555708', bp_ctc_id, 'stocks', 'Charles Schwab', '1138', 184000, false, null, 'manual', now() - interval '14 days'),
    ('55555555-5555-5555-5555-555555555709', bp_ctc_id, 'checking', 'First Community Private', '5521', 118500, false, null, 'statement', now() - interval '6 days'),
    ('55555555-5555-5555-5555-555555555710', bp_denied_id, 'checking', 'Starter Bank', '3304', 4600, false, null, 'manual', now() - interval '25 days')
  on conflict (id) do update
  set
    borrower_profile_id = excluded.borrower_profile_id,
    asset_type = excluded.asset_type,
    institution_name = excluded.institution_name,
    account_last4 = excluded.account_last4,
    balance = excluded.balance,
    is_gift = excluded.is_gift,
    gift_source = excluded.gift_source,
    verified_via = excluded.verified_via,
    verified_at = excluded.verified_at,
    deleted_at = null,
    updated_at = now();

  insert into public.liabilities (
    id, borrower_profile_id, liability_type, creditor_name, account_number_last4, monthly_payment, outstanding_balance,
    months_remaining, to_be_paid_off, exclude_from_dti, exclude_reason
  )
  values
    ('55555555-5555-5555-5555-555555555801', bp_submitted_id, 'auto', 'Toyota Financial', '5520', 410, 14800, 36, false, false, null),
    ('55555555-5555-5555-5555-555555555802', bp_submitted_id, 'credit_card', 'Visa Rewards', '2291', 115, 3200, 24, false, false, null),
    ('55555555-5555-5555-5555-555555555803', bp_processing_id, 'student', 'Navient', '4421', 225, 9100, 48, false, false, null),
    ('55555555-5555-5555-5555-555555555804', bp_underwriting_id, 'auto', 'Honda Finance', '1299', 385, 11200, 29, false, false, null),
    ('55555555-5555-5555-5555-555555555805', bp_underwriting_id, 'credit_card', 'MasterCard Platinum', '8911', 240, 7600, 22, false, false, null),
    ('55555555-5555-5555-5555-555555555806', bp_approved_id, 'credit_card', 'Travel Rewards', '4410', 160, 4100, 18, false, false, null),
    ('55555555-5555-5555-5555-555555555807', bp_approved_id, 'personal_loan', 'Best Egg', '2201', 190, 5300, 20, false, false, null),
    ('55555555-5555-5555-5555-555555555808', bp_ctc_id, 'mortgage', 'Legacy Mortgage', '0028', 2450, 402000, 240, true, false, null),
    ('55555555-5555-5555-5555-555555555809', bp_denied_id, 'credit_card', 'Cashline Bank', '7734', 385, 9200, 36, false, false, null),
    ('55555555-5555-5555-5555-555555555810', bp_denied_id, 'auto', 'Drive Auto', '6654', 520, 18800, 42, false, false, null)
  on conflict (id) do update
  set
    borrower_profile_id = excluded.borrower_profile_id,
    liability_type = excluded.liability_type,
    creditor_name = excluded.creditor_name,
    account_number_last4 = excluded.account_number_last4,
    monthly_payment = excluded.monthly_payment,
    outstanding_balance = excluded.outstanding_balance,
    months_remaining = excluded.months_remaining,
    to_be_paid_off = excluded.to_be_paid_off,
    exclude_from_dti = excluded.exclude_from_dti,
    exclude_reason = excluded.exclude_reason,
    deleted_at = null,
    updated_at = now();

  insert into public.properties (
    id, loan_application_id, address, property_type, occupancy_type, year_built, square_footage, lot_size_sqft,
    bedrooms, bathrooms, purchase_price, estimated_value, appraised_value, flood_zone
  )
  values
    (property_draft_id, loan_draft_id, '{"street":"1720 Lincoln Avenue","city":"San Jose","state":"CA","zip":"95125","county":"Santa Clara","msa_code":"41940"}'::jsonb, 'sfr', 'primary', 1986, 2180, 6400, 4, 2.5, 510000, 515000, null, 'X'),
    (property_submitted_id, loan_submitted_id, '{"street":"820 Blossom Hill Road","city":"San Jose","state":"CA","zip":"95123","county":"Santa Clara","msa_code":"41940"}'::jsonb, 'condo', 'primary', 2004, 1420, null, 3, 2.0, 332000, 335000, null, 'X'),
    (property_processing_id, loan_processing_id, '{"street":"400 Harbor Drive","city":"San Diego","state":"CA","zip":"92101","county":"San Diego","msa_code":"41740"}'::jsonb, 'townhouse', 'primary', 1999, 1680, 2100, 3, 2.5, 425000, 430000, null, 'X'),
    (property_underwriting_id, loan_underwriting_id, '{"street":"1024 Camino Verde","city":"San Jose","state":"CA","zip":"95120","county":"Santa Clara","msa_code":"41940"}'::jsonb, 'sfr', 'primary', 1994, 2310, 7200, 4, 3.0, 500000, 502000, 500000, 'AE'),
    (property_approved_id, loan_approved_id, '{"street":"58 Laurel Ridge Court","city":"Los Gatos","state":"CA","zip":"95032","county":"Santa Clara","msa_code":"41940"}'::jsonb, 'sfr', 'primary', 1988, 2440, 8200, 4, 3.0, 455000, 468000, 470000, 'X'),
    (property_ctc_id, loan_ctc_id, '{"street":"9 Oak Summit Lane","city":"Danville","state":"CA","zip":"94526","county":"Contra Costa","msa_code":"41860"}'::jsonb, 'sfr', 'primary', 2012, 3810, 11200, 5, 4.0, 1190000, 1215000, 1210000, 'X'),
    (property_denied_id, loan_denied_id, '{"street":"744 Orchard Lane","city":"Modesto","state":"CA","zip":"95350","county":"Stanislaus","msa_code":"33700"}'::jsonb, 'sfr', 'primary', 1978, 1610, 6700, 3, 2.0, 280000, 275000, 272000, 'AE')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    address = excluded.address,
    property_type = excluded.property_type,
    occupancy_type = excluded.occupancy_type,
    year_built = excluded.year_built,
    square_footage = excluded.square_footage,
    lot_size_sqft = excluded.lot_size_sqft,
    bedrooms = excluded.bedrooms,
    bathrooms = excluded.bathrooms,
    purchase_price = excluded.purchase_price,
    estimated_value = excluded.estimated_value,
    appraised_value = excluded.appraised_value,
    flood_zone = excluded.flood_zone,
    deleted_at = null,
    updated_at = now();

  insert into public.flood_certifications (
    id, property_id, flood_zone_code, flood_zone_desc, requires_insurance, cert_number, life_of_loan, determined_at, provider
  )
  values
    (flood_cert_approved_id, property_approved_id, 'X', 'Area of minimal flood hazard', false, 'FC-APP-10005', true, now() - interval '9 days', 'CoreLogic'),
    (flood_cert_ctc_id, property_ctc_id, 'X', 'Area of minimal flood hazard', false, 'FC-CTC-10006', true, now() - interval '7 days', 'ServiceLink')
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    flood_zone_code = excluded.flood_zone_code,
    flood_zone_desc = excluded.flood_zone_desc,
    requires_insurance = excluded.requires_insurance,
    cert_number = excluded.cert_number,
    life_of_loan = excluded.life_of_loan,
    determined_at = excluded.determined_at,
    provider = excluded.provider,
    deleted_at = null,
    updated_at = now();

  update public.properties
  set flood_cert_id = flood_cert_approved_id
  where id = property_approved_id;

  insert into public.documents (
    id, organization_id, loan_application_id, uploaded_by, document_type, document_category,
    file_name, storage_path, file_size_bytes, mime_type, checksum, version, parent_document_id, is_latest,
    status, reviewed_by, reviewed_at, rejection_reason, ai_extracted_data, ai_classified_at, expires_at, created_at
  )
  values
    (doc_underwriting_bank_statement_id, seed_org_id, loan_underwriting_id, borrower_user_id, 'bank_statement', 'borrower',
      'bank-statement-jan-2026.pdf', 'demo/loans/LN-2026-10004/bank-statement-jan-2026.pdf', 482311, 'application/pdf', 'sha256:uw-bank-10004', 1, null, true,
      'under_review', null, null, null, '{"detected_type":"bank_statement","confidence":0.96,"extracted_fields":{"borrower_name":"Taylor Borrower","date":"2026-01-31","employer_name":null,"income_amount":null,"period":"January 2026"},"anomalies":[]}'::jsonb, now() - interval '1 day', now() + interval '40 days', now() - interval '2 days'),
    (doc_underwriting_credit_auth_id, seed_org_id, loan_underwriting_id, borrower_user_id, 'credit_auth', 'compliance',
      'credit-authorization.pdf', 'demo/loans/LN-2026-10004/credit-authorization.pdf', 183240, 'application/pdf', 'sha256:uw-credit-auth-10004', 1, null, true,
      'pending', null, null, null, '{}'::jsonb, null, now() + interval '100 days', now() - interval '1 day'),
    (doc_underwriting_paystub_id, seed_org_id, loan_underwriting_id, borrower_user_id, 'paystub', 'borrower',
      'paystub-feb-2026.pdf', 'demo/loans/LN-2026-10004/paystub-feb-2026.pdf', 278115, 'application/pdf', 'sha256:uw-paystub-10004', 1, null, true,
      'pending', null, null, null, '{}'::jsonb, null, now() + interval '55 days', now() - interval '1 day'),
    (doc_approved_paystub_v1_id, seed_org_id, loan_approved_id, borrower_user_id, 'paystub', 'borrower',
      'paystub-jan-2026-v1.pdf', 'demo/loans/LN-2026-10005/paystub-jan-2026-v1.pdf', 251903, 'application/pdf', 'sha256:app-paystub-v1', 1, null, false,
      'rejected', loan_officer_user_id, now() - interval '8 days', 'Please upload a complete two-page paystub.', '{"detected_type":"paystub","confidence":0.88,"extracted_fields":{"borrower_name":"Taylor Borrower","date":"2026-01-15","employer_name":"Summit BioLabs","income_amount":5600,"period":"Semi-monthly"},"anomalies":["Missing page 2"]}'::jsonb, now() - interval '8 days', now() + interval '20 days', now() - interval '9 days'),
    (doc_approved_paystub_v2_id, seed_org_id, loan_approved_id, borrower_user_id, 'paystub', 'borrower',
      'paystub-jan-2026-v2.pdf', 'demo/loans/LN-2026-10005/paystub-jan-2026-v2.pdf', 366044, 'application/pdf', 'sha256:app-paystub-v2', 2, doc_approved_paystub_v1_id, true,
      'accepted', loan_officer_user_id, now() - interval '6 days', null, '{"detected_type":"paystub","confidence":0.98,"extracted_fields":{"borrower_name":"Taylor Borrower","date":"2026-01-31","employer_name":"Summit BioLabs","income_amount":5600,"period":"Semi-monthly"},"anomalies":[]}'::jsonb, now() - interval '6 days', now() + interval '54 days', now() - interval '7 days'),
    (doc_approved_w2_id, seed_org_id, loan_approved_id, borrower_user_id, 'w2', 'borrower',
      'w2-2025.pdf', 'demo/loans/LN-2026-10005/w2-2025.pdf', 214021, 'application/pdf', 'sha256:app-w2', 1, null, true,
      'accepted', loan_officer_user_id, now() - interval '6 days', null, '{}'::jsonb, null, null, now() - interval '7 days'),
    (doc_approved_bank_statement_id, seed_org_id, loan_approved_id, borrower_user_id, 'bank_statement', 'borrower',
      'bank-statement-feb-2026.pdf', 'demo/loans/LN-2026-10005/bank-statement-feb-2026.pdf', 490555, 'application/pdf', 'sha256:app-bank', 1, null, true,
      'accepted', processor_user_id, now() - interval '4 days', null, '{"detected_type":"bank_statement","confidence":0.95,"extracted_fields":{"borrower_name":"Taylor Borrower","date":"2026-02-28","employer_name":null,"income_amount":null,"period":"February 2026"},"anomalies":[]}'::jsonb, now() - interval '4 days', now() + interval '4 days', now() - interval '5 days'),
    (doc_approved_photo_id_id, seed_org_id, loan_approved_id, borrower_user_id, 'photo_id', 'borrower',
      'drivers-license.png', 'demo/loans/LN-2026-10005/drivers-license.png', 105433, 'image/png', 'sha256:app-photo-id', 1, null, true,
      'accepted', processor_user_id, now() - interval '5 days', null, '{}'::jsonb, null, now() + interval '200 days', now() - interval '6 days'),
    (doc_approved_purchase_contract_id, seed_org_id, loan_approved_id, borrower_user_id, 'purchase_contract', 'property',
      'purchase-contract.pdf', 'demo/loans/LN-2026-10005/purchase-contract.pdf', 614877, 'application/pdf', 'sha256:app-contract', 1, null, true,
      'accepted', loan_officer_user_id, now() - interval '10 days', null, '{}'::jsonb, null, null, now() - interval '11 days'),
    (doc_approved_appraisal_report_id, seed_org_id, loan_approved_id, processor_user_id, 'appraisal_report', 'property',
      'appraisal-report.pdf', 'demo/loans/LN-2026-10005/appraisal-report.pdf', 902441, 'application/pdf', 'sha256:app-appraisal', 1, null, true,
      'accepted', underwriter_user_id, now() - interval '3 days', null, '{}'::jsonb, null, null, now() - interval '4 days'),
    (doc_approved_flood_cert_id, seed_org_id, loan_approved_id, processor_user_id, 'flood_cert', 'property',
      'flood-certification.pdf', 'demo/loans/LN-2026-10005/flood-certification.pdf', 154203, 'application/pdf', 'sha256:app-flood-cert', 1, null, true,
      'accepted', processor_user_id, now() - interval '3 days', null, '{}'::jsonb, null, null, now() - interval '4 days'),
    (doc_approved_homeowners_insurance_id, seed_org_id, loan_approved_id, borrower_user_id, 'homeowners_insurance', 'property',
      'insurance-binder.pdf', 'demo/loans/LN-2026-10005/insurance-binder.pdf', 212403, 'application/pdf', 'sha256:app-insurance', 1, null, true,
      'accepted', processor_user_id, now() - interval '2 days', null, '{}'::jsonb, null, null, now() - interval '3 days'),
    (doc_approved_le_v1_id, seed_org_id, loan_approved_id, processor_user_id, 'loan_estimate', 'closing',
      'loan-estimate-v1.pdf', 'demo/loans/LN-2026-10005/loan-estimate-v1.pdf', 332201, 'application/pdf', 'sha256:app-le-v1', 1, null, false,
      'accepted', processor_user_id, now() - interval '11 days', null, '{}'::jsonb, null, null, now() - interval '12 days'),
    (doc_approved_le_v2_id, seed_org_id, loan_approved_id, processor_user_id, 'loan_estimate', 'closing',
      'loan-estimate-v2.pdf', 'demo/loans/LN-2026-10005/loan-estimate-v2.pdf', 335881, 'application/pdf', 'sha256:app-le-v2', 2, doc_approved_le_v1_id, true,
      'accepted', processor_user_id, now() - interval '7 days', null, '{}'::jsonb, null, null, now() - interval '8 days'),
    (doc_approved_cd_id, seed_org_id, loan_approved_id, processor_user_id, 'closing_disclosure', 'closing',
      'closing-disclosure-v1.pdf', 'demo/loans/LN-2026-10005/closing-disclosure-v1.pdf', 341288, 'application/pdf', 'sha256:app-cd-v1', 1, null, true,
      'accepted', processor_user_id, now() - interval '1 day', null, '{}'::jsonb, null, null, now() - interval '1 day'),
    (doc_ctc_title_commitment_id, seed_org_id, loan_ctc_id, processor_user_id, 'title_commitment', 'property',
      'title-commitment.pdf', 'demo/loans/LN-2026-10006/title-commitment.pdf', 412003, 'application/pdf', 'sha256:ctc-title', 1, null, true,
      'accepted', processor_user_id, now() - interval '2 days', null, '{}'::jsonb, null, null, now() - interval '3 days'),
    (doc_ctc_promissory_note_id, seed_org_id, loan_ctc_id, processor_user_id, 'promissory_note', 'closing',
      'promissory-note.pdf', 'demo/loans/LN-2026-10006/promissory-note.pdf', 220004, 'application/pdf', 'sha256:ctc-note', 1, null, true,
      'pending', null, null, null, '{}'::jsonb, null, null, now() - interval '1 day'),
    (doc_ctc_deed_of_trust_id, seed_org_id, loan_ctc_id, processor_user_id, 'deed_of_trust', 'closing',
      'deed-of-trust.pdf', 'demo/loans/LN-2026-10006/deed-of-trust.pdf', 218002, 'application/pdf', 'sha256:ctc-deed', 1, null, true,
      'pending', null, null, null, '{}'::jsonb, null, null, now() - interval '1 day'),
    (doc_denied_photo_id_id, seed_org_id, loan_denied_id, borrower_user_id, 'photo_id', 'borrower',
      'photo-id-denied.png', 'demo/loans/LN-2026-10007/photo-id.png', 94411, 'image/png', 'sha256:denied-photo-id', 1, null, true,
      'accepted', processor_user_id, now() - interval '9 days', null, '{}'::jsonb, null, now() + interval '200 days', now() - interval '9 days')
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    loan_application_id = excluded.loan_application_id,
    uploaded_by = excluded.uploaded_by,
    document_type = excluded.document_type,
    document_category = excluded.document_category,
    file_name = excluded.file_name,
    storage_path = excluded.storage_path,
    file_size_bytes = excluded.file_size_bytes,
    mime_type = excluded.mime_type,
    checksum = excluded.checksum,
    version = excluded.version,
    parent_document_id = excluded.parent_document_id,
    is_latest = excluded.is_latest,
    status = excluded.status,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at,
    rejection_reason = excluded.rejection_reason,
    ai_extracted_data = excluded.ai_extracted_data,
    ai_classified_at = excluded.ai_classified_at,
    expires_at = excluded.expires_at,
    deleted_at = null,
    updated_at = now();

  insert into public.appraisals (
    id, property_id, loan_application_id, amc_name, amc_order_number, appraiser_name, appraiser_license,
    ordered_at, inspection_date, received_at, reviewed_at, appraised_value, condition_rating, status, review_notes, report_document_id
  )
  values
    (appraisal_approved_id, property_approved_id, loan_approved_id, 'Premier AMC', 'AMC-10005', 'Dana Whitmore', 'CA-APP-55210',
      now() - interval '7 days', current_date - 6, now() - interval '5 days', now() - interval '3 days', 470000, 'C3', 'reviewed', 'Reviewed with no value issues.', doc_approved_appraisal_report_id),
    (appraisal_ctc_id, property_ctc_id, loan_ctc_id, 'Urban Value AMC', 'AMC-10006', 'Chris Patel', 'CA-APP-77811',
      now() - interval '5 days', current_date - 4, now() - interval '2 days', null, 1210000, 'C2', 'received', 'Awaiting final underwriting signoff.', null)
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    loan_application_id = excluded.loan_application_id,
    amc_name = excluded.amc_name,
    amc_order_number = excluded.amc_order_number,
    appraiser_name = excluded.appraiser_name,
    appraiser_license = excluded.appraiser_license,
    ordered_at = excluded.ordered_at,
    inspection_date = excluded.inspection_date,
    received_at = excluded.received_at,
    reviewed_at = excluded.reviewed_at,
    appraised_value = excluded.appraised_value,
    condition_rating = excluded.condition_rating,
    status = excluded.status,
    review_notes = excluded.review_notes,
    report_document_id = excluded.report_document_id,
    deleted_at = null,
    updated_at = now();

  insert into public.document_requests (
    id, loan_application_id, requested_by, document_type, message, due_date, status, fulfilled_by_document_id, fulfilled_at, waived_by, waived_reason
  )
  values
    (doc_request_underwriting_credit_auth_id, loan_underwriting_id, loan_officer_user_id, 'credit_auth', 'Please sign and upload the updated credit authorization so underwriting can refresh credit before approval.', current_date + 2, 'pending', null, null, null, null),
    (doc_request_approved_bank_statement_id, loan_approved_id, processor_user_id, 'bank_statement', 'Need your most recent full bank statement for final asset verification.', current_date - 3, 'fulfilled', doc_approved_bank_statement_id, now() - interval '4 days', null, null)
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    requested_by = excluded.requested_by,
    document_type = excluded.document_type,
    message = excluded.message,
    due_date = excluded.due_date,
    status = excluded.status,
    fulfilled_by_document_id = excluded.fulfilled_by_document_id,
    fulfilled_at = excluded.fulfilled_at,
    waived_by = excluded.waived_by,
    waived_reason = excluded.waived_reason,
    deleted_at = null,
    updated_at = now();

  insert into public.conditions (
    id, loan_application_id, condition_type, source, description, assigned_to, status, due_date, resolved_at, resolved_by, waived_reason, document_id
  )
  values
    (condition_underwriting_open_id, loan_underwriting_id, 'PTD', 'underwriter', 'Upload a newly signed credit authorization and one additional bank statement for asset continuity.', borrower_user_id, 'open', current_date + 3, null, null, null, doc_underwriting_bank_statement_id),
    (condition_approved_satisfied_id, loan_approved_id, 'PTD', 'processor', 'Provide a current full bank statement reflecting funds to close.', borrower_user_id, 'satisfied', current_date - 4, now() - interval '4 days', processor_user_id, null, doc_approved_bank_statement_id),
    (condition_approved_open_id, loan_approved_id, 'PTC', 'processor', 'Confirm homeowners insurance binder with final annual premium before closing.', borrower_user_id, 'open', current_date + 1, null, null, null, doc_approved_homeowners_insurance_id),
    (condition_approved_internal_id, loan_approved_id, 'GENERAL', 'compliance', 'Internal QC review of redisclosure timing before CD acknowledgment.', processor_user_id, 'submitted', current_date, null, null, null, doc_approved_le_v2_id)
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    condition_type = excluded.condition_type,
    source = excluded.source,
    description = excluded.description,
    assigned_to = excluded.assigned_to,
    status = excluded.status,
    due_date = excluded.due_date,
    resolved_at = excluded.resolved_at,
    resolved_by = excluded.resolved_by,
    waived_reason = excluded.waived_reason,
    document_id = excluded.document_id,
    deleted_at = null,
    updated_at = now();

  insert into public.credit_reports (
    id, borrower_profile_id, loan_application_id, requested_by, bureau, score, score_model, report_data, reference_number, pulled_at, expires_at
  )
  values
    ('90000000-0000-0000-0000-000000000001', bp_underwriting_id, loan_underwriting_id, underwriter_user_id, 'tri_merge', 742, 'FICO 8', '{"tradelines":12,"late_payments_last_12_months":0,"derogatory_items":0}'::jsonb, 'CR-10004', now() - interval '2 days', now() + interval '118 days'),
    ('90000000-0000-0000-0000-000000000002', bp_approved_id, loan_approved_id, underwriter_user_id, 'tri_merge', 758, 'FICO 8', '{"tradelines":16,"late_payments_last_12_months":0,"derogatory_items":0}'::jsonb, 'CR-10005', now() - interval '6 days', now() + interval '114 days'),
    ('90000000-0000-0000-0000-000000000003', bp_ctc_id, loan_ctc_id, underwriter_user_id, 'tri_merge', 781, 'FICO 8', '{"tradelines":21,"late_payments_last_12_months":0,"derogatory_items":0}'::jsonb, 'CR-10006', now() - interval '4 days', now() + interval '116 days'),
    ('90000000-0000-0000-0000-000000000004', bp_denied_id, loan_denied_id, underwriter_user_id, 'tri_merge', 598, 'FICO 8', '{"tradelines":6,"late_payments_last_12_months":3,"derogatory_items":2}'::jsonb, 'CR-10007', now() - interval '8 days', now() + interval '112 days')
  on conflict (id) do update
  set
    borrower_profile_id = excluded.borrower_profile_id,
    loan_application_id = excluded.loan_application_id,
    requested_by = excluded.requested_by,
    bureau = excluded.bureau,
    score = excluded.score,
    score_model = excluded.score_model,
    report_data = excluded.report_data,
    reference_number = excluded.reference_number,
    pulled_at = excluded.pulled_at,
    expires_at = excluded.expires_at,
    deleted_at = null,
    updated_at = now();

  insert into public.ai_analyses (
    id, loan_application_id, triggered_by_profile, analysis_type, model_used, triggered_by, input_snapshot, result,
    confidence_score, tokens_used, latency_ms, status, error_message, overridden_by, override_reason, overridden_at, created_at
  )
  values
    (ai_submitted_prequal_id, loan_submitted_id, null, 'prequalification', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":315000,"type":"fha"}}'::jsonb,
      '{"score":74,"recommendation":"needs_review","strengths":["Stable W-2 income","Adequate liquid reserves"],"concerns":["Higher housing payment relative to rent history","Gift funds require final sourcing"],"flags":[],"rationale":"The file is broadly workable but needs standard FHA documentation cleanup before moving to a stronger approval posture.","estimated_dti":43.2,"estimated_ltv":94.0}'::jsonb,
      0.74, 1875, 2100, 'completed', null, null, null, null, now() - interval '20 hours'),
    (ai_submitted_underwriting_id, loan_submitted_id, null, 'underwriting_summary', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":315000,"type":"fha"}}'::jsonb,
      '{"risk_score":71,"recommendation":"approve_with_conditions","strengths":["Payment shock is manageable","Income history appears stable","Assets cover minimum cash-to-close needs"],"concerns":["Gift funds need documentation","Condo review package outstanding"],"suggested_conditions":["Source gift funds","Collect condo questionnaire"],"key_ratios":{"dti":43.2,"ltv":94.0,"credit_score_adequacy":"adequate"},"executive_summary":"The loan appears financeable with standard FHA overlays and a short list of documentation conditions."}'::jsonb,
      0.71, 2140, 2450, 'completed', null, null, null, null, now() - interval '19 hours'),
    (ai_submitted_compliance_id, loan_submitted_id, null, 'compliance_check', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":315000,"type":"fha"}}'::jsonb,
      '{"compliance_status":"clear","issues":[],"trid_concerns":[],"fair_lending_notes":"No prohibited basis signals detected in the snapshot reviewed."}'::jsonb,
      0.92, 980, 1300, 'completed', null, null, null, null, now() - interval '19 hours'),
    (ai_underwriting_prequal_id, loan_underwriting_id, null, 'prequalification', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":410000,"type":"conventional"}}'::jsonb,
      '{"score":81,"recommendation":"likely_approve","strengths":["Strong primary income","Good credit profile","Reserves exceed minimum requirement"],"concerns":["Open documentation request for updated credit authorization"],"flags":["Recent large deposit requires explanation"],"rationale":"Overall credit and capacity are solid. The remaining concerns are documentation and auditability rather than core eligibility weakness.","estimated_dti":43.3,"estimated_ltv":82.0}'::jsonb,
      0.81, 2011, 2210, 'completed', null, null, null, null, now() - interval '28 hours'),
    (ai_underwriting_summary_id, loan_underwriting_id, null, 'underwriting_summary', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":410000,"type":"conventional"}}'::jsonb,
      '{"risk_score":77,"recommendation":"approve_with_conditions","strengths":["Credit score is above conventional minimum","LTV is within program tolerance","Borrower has meaningful reserves"],"concerns":["Need refreshed credit authorization","Documented deposit sourcing is incomplete"],"suggested_conditions":["Collect updated credit auth","Source large deposit","Obtain one more bank statement"],"key_ratios":{"dti":43.3,"ltv":82.0,"credit_score_adequacy":"strong"},"executive_summary":"The file is broadly approvable pending a small set of documentation conditions and refreshed borrower authorizations."}'::jsonb,
      0.77, 2388, 2510, 'completed', null, null, null, null, now() - interval '27 hours'),
    (ai_underwriting_compliance_id, loan_underwriting_id, null, 'compliance_check', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":410000,"type":"conventional"}}'::jsonb,
      '{"compliance_status":"review_required","issues":[{"type":"trid_timing","description":"A redisclosure may be needed if fees change materially after updated asset docs arrive.","severity":"medium","regulation":"TRID"}],"trid_concerns":["Monitor revised fee tolerance if updated assets change cash-to-close."],"fair_lending_notes":"Documented rationale should remain tied to credit, assets, and verified underwriting factors."}'::jsonb,
      0.69, 1110, 1430, 'completed', null, null, null, null, now() - interval '26 hours'),
    (ai_underwriting_risk_id, loan_underwriting_id, underwriter_user_id, 'risk_assessment', 'claude-sonnet-4-6-rules', 'manual',
      '{"loan":{"amount":410000,"type":"conventional"},"values":{"dti":0.433,"ltv":0.82,"cltv":0.82,"credit_score":742,"months_reserves":19.5,"loan_amount":410000}}'::jsonb,
      '{"loan_id":"44444444-4444-4444-4444-444444444444","loan_type":"conventional","recommendation":"approve_with_conditions","eligible_for_approval":true,"hard_stop_failures":[],"advisory_failures":["documentation_follow_up"],"values":{"dti":0.433,"ltv":0.82,"cltv":0.82,"credit_score":742,"months_reserves":19.5,"loan_amount":410000},"results":[{"rule_name":"min_credit_score","passed":true,"actual_value":742,"threshold":"min: 620","severity":"hard_stop","description":"Minimum representative credit score for conventional loans."},{"rule_name":"max_dti","passed":true,"actual_value":0.433,"threshold":"max: 0.45","severity":"advisory","description":"Maximum debt-to-income ratio for conventional loans."},{"rule_name":"max_ltv","passed":true,"actual_value":0.82,"threshold":"max: 0.97","severity":"hard_stop","description":"Maximum loan-to-value ratio for conventional loans."},{"rule_name":"min_months_reserves","passed":true,"actual_value":19.5,"threshold":"min: 2","severity":"advisory","description":"Minimum post-closing reserves for conventional loans."},{"rule_name":"max_loan_amount","passed":true,"actual_value":410000,"threshold":"max: 1500000","severity":"hard_stop","description":"Absolute maximum loan amount for the lending platform."},{"rule_name":"documentation_follow_up","passed":false,"actual_value":"updated_credit_auth_pending","threshold":"values: cleared","severity":"advisory","description":"Demonstration-only documentation follow-up item."}]}'::jsonb,
      0.75, null, null, 'completed', null, null, null, null, now() - interval '12 hours'),
    (ai_approved_prequal_id, loan_approved_id, null, 'prequalification', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":360000,"type":"conventional"}}'::jsonb,
      '{"score":88,"recommendation":"likely_approve","strengths":["Strong earnings history","Low projected DTI","Healthy verified balances"],"concerns":["None beyond normal closing prep"],"flags":[],"rationale":"The borrower profile supports a favorable recommendation and the file is already in final approval stages.","estimated_dti":28.2,"estimated_ltv":76.6}'::jsonb,
      0.88, 1655, 1900, 'completed', null, null, null, null, now() - interval '8 days'),
    (ai_approved_underwriting_id, loan_approved_id, null, 'underwriting_summary', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":360000,"type":"conventional"}}'::jsonb,
      '{"risk_score":90,"recommendation":"approve","strengths":["Excellent reserves","Credit profile is strong","Collateral support is solid"],"concerns":["Maintain document freshness through closing"],"suggested_conditions":["Confirm homeowners insurance binder"],"key_ratios":{"dti":28.2,"ltv":76.6,"credit_score_adequacy":"strong"},"executive_summary":"The file is approval-ready with only routine final closing conditions outstanding."}'::jsonb,
      0.90, 2214, 2315, 'completed', null, null, null, null, now() - interval '8 days'),
    (ai_approved_compliance_id, loan_approved_id, null, 'compliance_check', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":360000,"type":"conventional"}}'::jsonb,
      '{"compliance_status":"clear","issues":[],"trid_concerns":[],"fair_lending_notes":"Disposition and conditions align with documented underwriting factors."}'::jsonb,
      0.94, 1012, 1220, 'completed', null, null, null, null, now() - interval '8 days'),
    (ai_document_paystub_id, loan_approved_id, loan_officer_user_id, 'document_extraction', 'claude-sonnet-4-6', 'auto',
      '{"document_id":"77777777-7777-7777-7777-777777777705"}'::jsonb,
      '{"detected_type":"paystub","confidence":0.98,"extracted_fields":{"borrower_name":"Taylor Borrower","date":"2026-01-31","employer_name":"Summit BioLabs","income_amount":5600,"period":"Semi-monthly"},"anomalies":[]}'::jsonb,
      0.98, 620, 880, 'completed', null, null, null, null, now() - interval '6 days'),
    (ai_document_bank_statement_id, loan_approved_id, processor_user_id, 'document_extraction', 'claude-sonnet-4-6', 'auto',
      '{"document_id":"77777777-7777-7777-7777-777777777707"}'::jsonb,
      '{"detected_type":"bank_statement","confidence":0.95,"extracted_fields":{"borrower_name":"Taylor Borrower","date":"2026-02-28","employer_name":null,"income_amount":null,"period":"February 2026"},"anomalies":[]}'::jsonb,
      0.95, 598, 830, 'completed', null, null, null, null, now() - interval '4 days'),
    (ai_denied_prequal_id, loan_denied_id, null, 'prequalification', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":265000,"type":"usda"}}'::jsonb,
      '{"score":46,"recommendation":"high_risk","strengths":["Stable occupancy intent"],"concerns":["Credit score below program minimum","Thin reserves","High debt burden"],"flags":["Recent late payments"],"rationale":"The loan does not meet baseline credit and capacity expectations for the selected program as currently structured.","estimated_dti":53.1,"estimated_ltv":97.4}'::jsonb,
      0.46, 1760, 2040, 'completed', null, null, null, null, now() - interval '9 days'),
    (ai_denied_underwriting_id, loan_denied_id, null, 'underwriting_summary', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":265000,"type":"usda"}}'::jsonb,
      '{"risk_score":39,"recommendation":"deny","strengths":["Stable employment was documented"],"concerns":["Credit score below floor","DTI above tolerance","Minimal liquid reserves"],"suggested_conditions":["Consider alternative product or significant debt reduction before resubmission"],"key_ratios":{"dti":53.1,"ltv":97.4,"credit_score_adequacy":"insufficient"},"executive_summary":"The file does not satisfy current USDA overlays and should not proceed without material borrower improvement."}'::jsonb,
      0.39, 2091, 2400, 'completed', null, null, null, null, now() - interval '9 days'),
    (ai_denied_compliance_id, loan_denied_id, null, 'compliance_check', 'claude-sonnet-4-6', 'auto',
      '{"loan":{"amount":265000,"type":"usda"}}'::jsonb,
      '{"compliance_status":"clear","issues":[],"trid_concerns":[],"fair_lending_notes":"Denial rationale is tied to documented credit and capacity variables only."}'::jsonb,
      0.89, 990, 1222, 'completed', null, null, null, null, now() - interval '9 days')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    triggered_by_profile = excluded.triggered_by_profile,
    analysis_type = excluded.analysis_type,
    model_used = excluded.model_used,
    triggered_by = excluded.triggered_by,
    input_snapshot = excluded.input_snapshot,
    result = excluded.result,
    confidence_score = excluded.confidence_score,
    tokens_used = excluded.tokens_used,
    latency_ms = excluded.latency_ms,
    status = excluded.status,
    error_message = excluded.error_message,
    overridden_by = excluded.overridden_by,
    override_reason = excluded.override_reason,
    overridden_at = excluded.overridden_at,
    created_at = excluded.created_at;

  insert into public.fraud_flags (
    id, loan_application_id, ai_analysis_id, flag_type, severity, description, evidence, status, reviewed_by, reviewed_at, review_notes
  )
  values
    (fraud_flag_underwriting_id, loan_underwriting_id, ai_underwriting_summary_id, 'income_mismatch', 'medium', 'Large non-payroll deposit in checking account should be sourced before approval.', '{"document_id":"77777777-7777-7777-7777-777777777701","amount":12500}'::jsonb, 'under_review', underwriter_user_id, now() - interval '11 hours', 'Pending updated bank statement and LOE.')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    ai_analysis_id = excluded.ai_analysis_id,
    flag_type = excluded.flag_type,
    severity = excluded.severity,
    description = excluded.description,
    evidence = excluded.evidence,
    status = excluded.status,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at,
    review_notes = excluded.review_notes,
    deleted_at = null,
    updated_at = now();

  insert into public.loan_fees (
    id, loan_application_id, fee_type, fee_name, amount, paid_by, disclosure_section, can_increase, tolerance_bucket
  )
  values
    ('91000000-0000-0000-0000-000000000001', loan_approved_id, 'origination', 'Origination Fee', 1500, 'borrower', 'A', false, 'zero'),
    ('91000000-0000-0000-0000-000000000002', loan_approved_id, 'appraisal', 'Appraisal Fee', 550, 'borrower', 'B', true, 'ten_percent'),
    ('91000000-0000-0000-0000-000000000003', loan_approved_id, 'credit_report', 'Credit Report', 75, 'borrower', 'B', false, 'zero'),
    ('91000000-0000-0000-0000-000000000004', loan_approved_id, 'flood_cert', 'Flood Determination', 20, 'borrower', 'B', false, 'zero'),
    ('91000000-0000-0000-0000-000000000005', loan_approved_id, 'title_search', 'Title Search', 200, 'borrower', 'C', true, 'ten_percent'),
    ('91000000-0000-0000-0000-000000000006', loan_approved_id, 'title_insurance', 'Lender Title Insurance', 850, 'borrower', 'B', true, 'ten_percent'),
    ('91000000-0000-0000-0000-000000000007', loan_ctc_id, 'origination', 'Origination Fee', 2200, 'borrower', 'A', false, 'zero'),
    ('91000000-0000-0000-0000-000000000008', loan_ctc_id, 'appraisal', 'Appraisal Fee', 800, 'borrower', 'B', true, 'ten_percent'),
    ('91000000-0000-0000-0000-000000000009', loan_ctc_id, 'credit_report', 'Credit Report', 95, 'borrower', 'B', false, 'zero'),
    ('91000000-0000-0000-0000-000000000010', loan_ctc_id, 'flood_cert', 'Flood Determination', 35, 'borrower', 'B', false, 'zero'),
    ('91000000-0000-0000-0000-000000000011', loan_ctc_id, 'title_search', 'Title Search', 325, 'borrower', 'C', true, 'ten_percent'),
    ('91000000-0000-0000-0000-000000000012', loan_ctc_id, 'title_insurance', 'Lender Title Insurance', 1250, 'borrower', 'B', true, 'ten_percent')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    fee_type = excluded.fee_type,
    fee_name = excluded.fee_name,
    amount = excluded.amount,
    paid_by = excluded.paid_by,
    disclosure_section = excluded.disclosure_section,
    can_increase = excluded.can_increase,
    tolerance_bucket = excluded.tolerance_bucket,
    deleted_at = null,
    updated_at = now();

  insert into public.rate_locks (
    id, loan_application_id, loan_product_id, locked_by, rate, apr, points, lock_period_days, locked_at, expires_at, extended_to, status
  )
  values
    (rate_lock_approved_id, loan_approved_id, conventional_product_id, loan_officer_user_id, 6.8750, 7.1120, 0.2500, 30, now() - interval '2 days', now() + interval '2 days', null, 'active')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    loan_product_id = excluded.loan_product_id,
    locked_by = excluded.locked_by,
    rate = excluded.rate,
    apr = excluded.apr,
    points = excluded.points,
    lock_period_days = excluded.lock_period_days,
    locked_at = excluded.locked_at,
    expires_at = excluded.expires_at,
    extended_to = excluded.extended_to,
    status = excluded.status,
    deleted_at = null,
    updated_at = now();

  insert into public.underwriting_decisions (
    id, loan_application_id, underwriter_id, decision, decision_pass, approved_amount, dti_ratio, ltv_ratio, cltv_ratio,
    credit_score_used, denial_reasons, notes, decided_at, ai_summary
  )
  values
    (uw_decision_approved_id, loan_approved_id, underwriter_user_id, 'approved', 1, 360000, 0.2820, 0.7660, 0.7660, 758, '[]'::jsonb,
      'Approved subject to final insurance confirmation and standard closing prep.', now() - interval '5 days',
      '{"risk_score":90,"strengths":["Excellent reserves","Strong credit profile"],"concerns":["Routine closing readiness only"],"recommendation":"approve"}'::jsonb),
    (uw_decision_denied_id, loan_denied_id, underwriter_user_id, 'denied', 1, null, 0.5310, 0.9740, 0.9740, 598, '[1,3]'::jsonb,
      'Denied for insufficient credit score and excessive debt-to-income ratio.', denied_at_ts,
      '{"risk_score":39,"strengths":["Stable employment"],"concerns":["Credit below program minimum","High DTI"],"recommendation":"deny"}'::jsonb)
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    underwriter_id = excluded.underwriter_id,
    decision = excluded.decision,
    decision_pass = excluded.decision_pass,
    approved_amount = excluded.approved_amount,
    dti_ratio = excluded.dti_ratio,
    ltv_ratio = excluded.ltv_ratio,
    cltv_ratio = excluded.cltv_ratio,
    credit_score_used = excluded.credit_score_used,
    denial_reasons = excluded.denial_reasons,
    notes = excluded.notes,
    decided_at = excluded.decided_at,
    ai_summary = excluded.ai_summary,
    deleted_at = null,
    updated_at = now();

  insert into public.tasks (
    id, loan_application_id, assigned_to, assigned_by, title, description, due_date, priority, status, task_type, completed_at, completed_by
  )
  values
    (task_borrower_doc_collection_id, loan_underwriting_id, borrower_user_id, loan_officer_user_id, 'Upload updated credit authorization', 'Borrower must complete the refreshed credit authorization to continue underwriting.', current_date + 2, 'high', 'pending', 'doc_collection', null, null),
    (task_lo_followup_id, loan_submitted_id, loan_officer_user_id, admin_user_id, 'Call borrower to review FHA documentation', 'Review gift funds, condo association package, and expected timeline.', current_date + 1, 'medium', 'pending', 'general', null, null),
    (task_processor_disclosure_id, loan_approved_id, processor_user_id, loan_officer_user_id, 'Prepare revised LE and final CD package', 'Redisclosure review is needed before final CD acknowledgment.', current_date, 'urgent', 'in_progress', 'disclosure', null, null),
    (task_underwriter_review_id, loan_denied_id, underwriter_user_id, loan_officer_user_id, 'Finalize denial rationale and adverse action support', 'Confirm ECOA/HMDA codes and supporting notes for the denied file.', current_date - 2, 'high', 'completed', 'review', denied_at_ts, underwriter_user_id)
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    assigned_to = excluded.assigned_to,
    assigned_by = excluded.assigned_by,
    title = excluded.title,
    description = excluded.description,
    due_date = excluded.due_date,
    priority = excluded.priority,
    status = excluded.status,
    task_type = excluded.task_type,
    completed_at = excluded.completed_at,
    completed_by = excluded.completed_by,
    deleted_at = null,
    updated_at = now();

  insert into public.messages (
    id, loan_application_id, sender_id, body, channel, is_internal, read_at, attachment_ids, created_at
  )
  values
    (message_borrower_id, loan_underwriting_id, borrower_user_id, 'I uploaded the latest bank statement. Please let me know if you still need the new credit authorization signed today.', 'in_app', false, now() - interval '10 hours', array[doc_underwriting_bank_statement_id], now() - interval '12 hours'),
    (message_lo_reply_id, loan_underwriting_id, loan_officer_user_id, 'Received. The bank statement looks good. We still need the refreshed credit authorization before underwriting can clear the file.', 'in_app', false, now() - interval '9 hours', '{}'::uuid[], now() - interval '11 hours'),
    (message_processor_internal_id, loan_underwriting_id, processor_user_id, 'Internal note: hold redisclosure until the refreshed authorization is uploaded.', 'in_app', true, null, '{}'::uuid[], now() - interval '8 hours'),
    (message_underwriter_id, loan_underwriting_id, underwriter_user_id, 'Once the authorization is in, I can re-run the credit and finalize the decision path.', 'in_app', false, null, '{}'::uuid[], now() - interval '7 hours')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    sender_id = excluded.sender_id,
    body = excluded.body,
    channel = excluded.channel,
    is_internal = excluded.is_internal,
    read_at = excluded.read_at,
    attachment_ids = excluded.attachment_ids,
    created_at = excluded.created_at,
    deleted_at = null,
    updated_at = now();

  insert into public.notifications (
    id, organization_id, recipient_id, type, title, body, action_url, resource_type, resource_id, read_at, sent_via, created_at
  )
  values
    (notification_borrower_doc_req_id, seed_org_id, borrower_user_id, 'doc_requested', 'Document requested', 'Please upload the refreshed credit authorization for loan LN-2026-10004.', '/borrower/loans/44444444-4444-4444-4444-444444444444/documents', 'loan', loan_underwriting_id, null, array['in_app','email'], now() - interval '10 hours'),
    (notification_borrower_condition_id, seed_org_id, borrower_user_id, 'condition_added', 'New loan condition added', 'Confirm the homeowners insurance binder before closing.', '/borrower/loans/44444444-4444-4444-4444-444444444445', 'condition', condition_approved_open_id, null, array['in_app','email'], now() - interval '2 hours'),
    (notification_borrower_status_id, seed_org_id, borrower_user_id, 'status_change', 'Loan decision: approved', 'Your loan LN-2026-10005 has been approved and is moving toward closing.', '/borrower/loans/44444444-4444-4444-4444-444444444445', 'loan', loan_approved_id, now() - interval '1 day', array['in_app','email'], now() - interval '1 day'),
    (notification_lo_message_id, seed_org_id, loan_officer_user_id, 'message_received', 'New borrower message', 'Taylor Borrower sent a message on LN-2026-10004.', '/staff/loans/44444444-4444-4444-4444-444444444444/messages', 'message', message_borrower_id, null, array['in_app'], now() - interval '12 hours'),
    (notification_lo_rate_lock_id, seed_org_id, loan_officer_user_id, 'rate_lock_expiring', 'Rate lock expiring soon', 'The rate lock on LN-2026-10005 expires in 2 days.', '/staff/loans/44444444-4444-4444-4444-444444444445/pricing', 'loan', loan_approved_id, null, array['in_app','email'], now() - interval '3 hours'),
    (notification_lo_task_id, seed_org_id, loan_officer_user_id, 'task_assigned', 'Task assigned', 'Call borrower to review FHA documentation.', '/staff/loans/44444444-4444-4444-4444-444444444442/tasks', 'task', task_lo_followup_id, null, array['in_app','email'], now() - interval '5 hours'),
    (notification_processor_task_id, seed_org_id, processor_user_id, 'task_assigned', 'Task assigned', 'Prepare revised LE and final CD package.', '/staff/loans/44444444-4444-4444-4444-444444444445/tasks', 'task', task_processor_disclosure_id, null, array['in_app','email'], now() - interval '4 hours'),
    (notification_underwriter_task_id, seed_org_id, underwriter_user_id, 'task_assigned', 'Task assigned', 'Finalize denial rationale and adverse action support.', '/staff/loans/44444444-4444-4444-4444-444444444447/tasks', 'task', task_underwriter_review_id, now() - interval '2 days', array['in_app'], now() - interval '2 days'),
    (notification_admin_disclosure_id, seed_org_id, admin_user_id, 'disclosure_due', 'CD issued', 'Closing Disclosure issued for LN-2026-10005.', '/admin/compliance', 'loan', loan_approved_id, now() - interval '20 hours', array['in_app'], now() - interval '20 hours')
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    recipient_id = excluded.recipient_id,
    type = excluded.type,
    title = excluded.title,
    body = excluded.body,
    action_url = excluded.action_url,
    resource_type = excluded.resource_type,
    resource_id = excluded.resource_id,
    read_at = excluded.read_at,
    sent_via = excluded.sent_via,
    created_at = excluded.created_at,
    deleted_at = null,
    updated_at = now();

  insert into public.audit_logs (
    id, organization_id, actor_id, action, resource_type, resource_id, before_state, after_state, session_id, created_at
  )
  values
    (audit_loan_submitted_id, seed_org_id, borrower_user_id, 'loan.submitted', 'loan_application', loan_submitted_id, '{"status":"draft"}'::jsonb, '{"status":"submitted"}'::jsonb, 'demo-seed', now() - interval '20 hours'),
    (audit_doc_requested_id, seed_org_id, loan_officer_user_id, 'document.requested', 'loan_application', loan_underwriting_id, '{}'::jsonb, jsonb_build_object('document_type', 'credit_auth', 'due_date', (current_date + 2)::text), 'demo-seed', now() - interval '10 hours'),
    (audit_doc_accepted_id, seed_org_id, processor_user_id, 'document.accepted', 'document', doc_approved_bank_statement_id, '{"status":"under_review"}'::jsonb, '{"status":"accepted"}'::jsonb, 'demo-seed', now() - interval '4 days'),
    (audit_condition_added_id, seed_org_id, processor_user_id, 'condition.created', 'loan_application', loan_approved_id, '{}'::jsonb, '{"condition_type":"PTC","description":"Confirm homeowners insurance binder with final annual premium before closing."}'::jsonb, 'demo-seed', now() - interval '2 days'),
    (audit_task_created_id, seed_org_id, admin_user_id, 'task.created', 'task', task_lo_followup_id, '{}'::jsonb, '{"title":"Call borrower to review FHA documentation"}'::jsonb, 'demo-seed', now() - interval '5 hours'),
    (audit_task_completed_id, seed_org_id, underwriter_user_id, 'task.completed', 'task', task_underwriter_review_id, '{"status":"pending"}'::jsonb, '{"status":"completed"}'::jsonb, 'demo-seed', denied_at_ts),
    (audit_underwriting_decision_id, seed_org_id, underwriter_user_id, 'underwriting.decision_made', 'loan_application', loan_approved_id, '{"status":"underwriting"}'::jsonb, '{"decision":"approved","status":"approved"}'::jsonb, 'demo-seed', now() - interval '5 days'),
    (audit_rate_lock_id, seed_org_id, loan_officer_user_id, 'pricing.rate_locked', 'loan_application', loan_approved_id, '{}'::jsonb, '{"rate":6.875,"lock_period_days":30}'::jsonb, 'demo-seed', now() - interval '2 days'),
    (audit_disclosure_issue_id, seed_org_id, processor_user_id, 'disclosure.issued', 'loan_application', loan_approved_id, '{}'::jsonb, '{"type":"CD","version":1}'::jsonb, 'demo-seed', now() - interval '1 day'),
    (audit_message_sent_id, seed_org_id, loan_officer_user_id, 'message.sent', 'message', message_lo_reply_id, '{}'::jsonb, '{"is_internal":false}'::jsonb, 'demo-seed', now() - interval '11 hours'),
    (audit_pipeline_move_id, seed_org_id, processor_user_id, 'loan.stage_changed', 'loan_application', loan_processing_id, '{"pipeline_stage":"Application"}'::jsonb, '{"pipeline_stage":"Processing"}'::jsonb, 'demo-seed', now() - interval '2 days'),
    (audit_hmda_capture_id, seed_org_id, underwriter_user_id, 'hmda.record_upserted', 'loan_application', loan_denied_id, '{}'::jsonb, '{"action_taken":3}'::jsonb, 'demo-seed', denied_at_ts + interval '10 minutes')
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    actor_id = excluded.actor_id,
    action = excluded.action,
    resource_type = excluded.resource_type,
    resource_id = excluded.resource_id,
    before_state = excluded.before_state,
    after_state = excluded.after_state,
    session_id = excluded.session_id,
    created_at = excluded.created_at;

  insert into public.disclosures (
    id, loan_application_id, issued_by, disclosure_type, version, sent_at, deadline, acknowledged_at, acknowledged_by, status, document_id, notes
  )
  values
    (disclosure_le_v1_id, loan_approved_id, processor_user_id, 'LE', 1, now() - interval '11 days', now() - interval '8 days', now() - interval '10 days', borrower_user_id, 'superseded', doc_approved_le_v1_id, 'Original LE superseded after fee update.'),
    (disclosure_le_v2_id, loan_approved_id, processor_user_id, 'LE', 2, now() - interval '7 days', now() - interval '4 days', now() - interval '6 days', borrower_user_id, 'acknowledged', doc_approved_le_v2_id, 'Revised LE acknowledged by borrower.'),
    (disclosure_cd_v1_id, loan_approved_id, processor_user_id, 'CD', 1, now() - interval '1 day', (current_date + 2)::timestamptz, null, null, 'sent', doc_approved_cd_id, 'CD issued from compliance workspace.')
  on conflict (id) do update
  set
    loan_application_id = excluded.loan_application_id,
    issued_by = excluded.issued_by,
    disclosure_type = excluded.disclosure_type,
    version = excluded.version,
    sent_at = excluded.sent_at,
    deadline = excluded.deadline,
    acknowledged_at = excluded.acknowledged_at,
    acknowledged_by = excluded.acknowledged_by,
    status = excluded.status,
    document_id = excluded.document_id,
    notes = excluded.notes,
    deleted_at = null,
    updated_at = now();

  insert into public.hmda_records (
    id, loan_application_id, organization_id, action_taken, action_taken_date, denial_reasons,
    ethnicity_data, race_data, sex_data, census_tract, msa_code, county_code,
    loan_purpose_hmda, property_type_hmda, lien_status, hoepa_status, rate_spread, reporting_year
  )
  values
    (hmda_denied_id, loan_denied_id, seed_org_id, 3, denied_at_ts::date, array[1, 3],
      '{"applicant":"not_hispanic_or_latino"}'::jsonb, '{"applicant":["white"]}'::jsonb, '{"applicant":"female"}'::jsonb,
      '06099005001', '33700', '099', 1, 1, 1, 3, null, extract(year from current_date)::integer)
  on conflict (loan_application_id) do update
  set
    organization_id = excluded.organization_id,
    action_taken = excluded.action_taken,
    action_taken_date = excluded.action_taken_date,
    denial_reasons = excluded.denial_reasons,
    ethnicity_data = excluded.ethnicity_data,
    race_data = excluded.race_data,
    sex_data = excluded.sex_data,
    census_tract = excluded.census_tract,
    msa_code = excluded.msa_code,
    county_code = excluded.county_code,
    loan_purpose_hmda = excluded.loan_purpose_hmda,
    property_type_hmda = excluded.property_type_hmda,
    lien_status = excluded.lien_status,
    hoepa_status = excluded.hoepa_status,
    rate_spread = excluded.rate_spread,
    reporting_year = excluded.reporting_year,
    deleted_at = null,
    updated_at = now();

  insert into public.analytics_events (
    id, organization_id, actor_id, loan_application_id, event_name, properties, session_id, device_type, browser, created_at
  )
  values
    (analytics_borrower_step_id, seed_org_id, borrower_user_id, loan_draft_id, 'borrower.app_step_completed', '{"step":1,"step_name":"loan_details","time_spent_seconds":148}'::jsonb, 'sess-borrower-1', 'desktop', 'Chrome', now() - interval '5 days'),
    (analytics_doc_upload_id, seed_org_id, borrower_user_id, loan_underwriting_id, 'borrower.document_uploaded', '{"document_type":"bank_statement"}'::jsonb, 'sess-borrower-2', 'desktop', 'Chrome', now() - interval '2 days'),
    (analytics_pipeline_view_id, seed_org_id, loan_officer_user_id, loan_processing_id, 'lo.pipeline_viewed', '{"filters":{"loan_type":"all","sla":"all"}}'::jsonb, 'sess-lo-1', 'desktop', 'Chrome', now() - interval '1 day'),
    (analytics_ai_trigger_id, seed_org_id, underwriter_user_id, loan_underwriting_id, 'system.ai_analysis_triggered', '{"analysis_type":"risk_assessment","triggered_by":"manual"}'::jsonb, 'sess-uw-1', 'desktop', 'Chrome', now() - interval '12 hours'),
    (analytics_pricing_view_id, seed_org_id, loan_officer_user_id, loan_approved_id, 'lo.pricing_viewed', '{"loan_number":"LN-2026-10005"}'::jsonb, 'sess-lo-2', 'desktop', 'Chrome', now() - interval '3 hours')
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    actor_id = excluded.actor_id,
    loan_application_id = excluded.loan_application_id,
    event_name = excluded.event_name,
    properties = excluded.properties,
    session_id = excluded.session_id,
    device_type = excluded.device_type,
    browser = excluded.browser,
    created_at = excluded.created_at;
end
$seed$;
