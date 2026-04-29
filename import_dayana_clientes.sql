-- ============================================
-- IMPORTAÇÃO DE CLIENTES DA DAYANA E HISTÓRICO
-- ============================================

DO $$
DECLARE
  v_owner uuid;
  v_customer_id uuid;
BEGIN
  SELECT id INTO v_owner FROM public.profiles WHERE LOWER(email) = LOWER('dayana_tbperez@hotmail.com');
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Usuária Dayana não encontrada.'; END IF;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Adriana Ribeiro', '11944445044', '', '', '', '1977-11-30'::date, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Alan Elias', '11942478616', 'alan_.elias00', '', '', '2003-11-01'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 274.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 274.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Ale Vasquez', '11963448886', 'ale.teacher_', '', '', NULL, 'p', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 494.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 494.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Alessandra', '11997419175', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Ana Luiza Marson', '11975296984', 'analu_marson', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Anderson Reina', '11947513951', '', '', '', '1982-08-15'::date, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 654.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 654.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Andrea', '11964388989', '', '', '', NULL, 'usa P', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Bia Cayres', '11997020505', '', '', '', '1996-03-24'::date, 'm', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Bianca Perez Correia', '11987498889', '', '', '', '1988-02-02'::date, 'p', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 70.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 70.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Bianca Ribeiro', '11999164333', '', '', '', '2000-08-18'::date, 'g', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 141.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 141.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Bibi Junqueira', '11996296207', '', '', '', NULL, 'M G', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 807.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 807.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Camila Iha', '11997159636', 'camilaiha', '', '', '2000-03-13'::date, 'P e M', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Camila Iris', '11974937068', '', '', '', NULL, 'm', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 274.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 274.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Camila Martins', '11 98631-9103', '', '', '', '1982-01-14'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 116.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 116.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Camilla Iha', '11997159636', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Carol Xavier', '11956901306', '@carol.xavier.75286', '', '', '1988-08-24'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 176.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 176.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Cássia', '11 99153-7554', '', '', '', NULL, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 521.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 521.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Cassia (amiga Gabi)', '11991336715', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Catia Marques', '11991394116', 'catia_0512', '', '', '1967-05-12'::date, 'm', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Cidinha', '11992191549', 'cidinhaoliver', '', '', NULL, 'M ou G', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 273.05, 'legacy_import', 'completed', 'Importação de Histórico: R$ 273.05');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Daiane Russani', '11997982068', '', '', '', NULL, 'm g', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 131.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 131.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Dani extreme esposa rodrigo', '11017480022', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 466.2, 'legacy_import', 'completed', 'Importação de Histórico: R$ 466.2');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Dani Padilha', '11 98898-3464', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Dani Roncoletta', '11994555930', 'dradanironcoleta', '', '', NULL, 'm', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 391.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 391.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Daniel Fonseca', '11983551089', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 89.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 89.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Daniella Regis', '11974488953', 'daniellaregis', '', '', '1992-08-01'::date, 'M', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Day', '11980364511', '', '', '', '1988-12-03'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 466.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 466.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Deiseane Duarte', '11 96655-3394', 'deiseanelduarte', '', '', '1990-03-24'::date, 'P', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Dra Simony Morais', '35 99912-7237', 'drasimonymorais', '', '', NULL, 'G', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Edymn (Ederson Marques)', '11988341145', '@edymn', '', '', NULL, 'P', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Erica de Oliveira', '11979672195', 'ericaeol', '', '', '1991-05-17'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 90.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 90.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Fabi Sales', '11985322788', '', '', '', '1988-08-10'::date, 'm', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 179.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 179.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Fernanda Fragoso', '11976422361', '', '', '', NULL, 'M', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Flavia Valente', '11941144103', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Fran', '11 99126-8395', '', '', '', '1991-01-05'::date, 'Usa P', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Francine Dias', '11964019622', '', '', '', '1990-08-06'::date, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Gabi Aguirre', '11974020553', '', '', '', '1994-05-18'::date, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 131.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 131.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Gabi Beerblioteca', '11979901867', 'beerbliotecaatibaia', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 2898.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 2898.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Gabi Ferrari', '11 99756-7648', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Gabi Ferrari', '11 99756-7648', '', '', '', '2026-01-03'::date, 'P', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 177.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 177.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Gabriel Prado', '11970947574', 'corretorgabrielatibaia', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 364.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 364.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Gabriela Santos (Seba)', '11 94235-4390', '', '', '', '1995-05-02'::date, 'P', 'Gosta de macaquinho') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 263.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 263.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Janaína Soares Schuck', '11 96587-4788', 'jana_schuck', '303.154.278-92', 'Rua Antônia Bizarro, 92, Apto 42, Vila Osasco, Osasco, 06083160', '1983-03-26'::date, 'G', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 527.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 527.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Janis Beydoun', '11996503609', 'janisbeydoun', '', '', NULL, 'M G', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 179.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 179.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Jéssica Matos', '11999368488', 'jematos', '', '', '1991-08-13'::date, 'M', 'Caio tb usa M Não gosta de nada apertando Não gosta do top carol;amanda') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Jéssica Yukimi Suzuki', '11999358801', '', '', '', '1992-05-08'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 140.6, 'legacy_import', 'completed', 'Importação de Histórico: R$ 140.6');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Juliana Castro Montechiesi', '11992877196', 'jucastro_neta', '', '', NULL, 'g', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 151.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 151.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Juscimara', '35998187014', '', '', '', NULL, 'g1', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 560.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 560.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Jussane Medina', '51993041125', 'jussanemedina', '', '', '1978-02-21'::date, 'top m shorts gg', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 1113.05, 'legacy_import', 'completed', 'Importação de Histórico: R$ 1113.05');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Kiki', '', '', '', '', '1995-03-23'::date, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Kiki Iha', '11 99588-4175', '@walkiria_iha', '', '', '1992-03-22'::date, 'M', 'Ama rosa') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Leticia Fianeze', '11915693585', 'leticia.fianeze', '', '', NULL, 'Top G shorts M', 'Gosta do empina bumbum e camiseta over') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Lidiane', '11971891456', '', '', '', '1988-02-22'::date, 'M', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Lidy', '11 99783-0275', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 178.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 178.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Lu Barbosa', '11912845854', '@lubarbosah', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Luana', '11973969036', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 375.25, 'legacy_import', 'completed', 'Importação de Histórico: R$ 375.25');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Luana', '11973969036', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 375.25, 'legacy_import', 'completed', 'Importação de Histórico: R$ 375.25');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Luciana Escudeiro (amiga Dai Russani)', '11974835978', '', '', '', NULL, 'g gg', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 94.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 94.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Lud', '17 99765-2933', '', '', '', '1985-12-22'::date, 'P', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Luma Beatriz', '11941711996', '', '408.409.988-05', 'RUA PROF JOSÁ MARIA CALAZANS NOGUEIRA, 232, Apto 303 A, PQ SÃO DOMINGOS, São Paulo, 05122010', '1991-12-09'::date, 'G', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Marcelle Silvano', '11996318595', 'marcelle.silvano', '', '', '1982-09-19'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 735.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 735.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Márcia Cross Crew', '11941189232', '', '', '', '1985-03-25'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 434.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 434.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Maria Carmo Revenda Ponta Grossa', '42984130365', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Marina Maitina', '11 96057-3253', '', '', '', '1987-03-23'::date, 'P', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Mayara Bueno Duete', '11972829205', '', '', '', '1994-07-16'::date, 'g', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 1032.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 1032.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Michele Silva (Mi)', '35997459855', '@mi_silvamg', '', '', NULL, 'M', 'Gosta do cropped Carol') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Michelle Cris', '11939292886', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 1717.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 1717.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Michelle Cris', '11939292886', '', '', '', NULL, 'Top M shorts P', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 5896.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 5896.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Pamela Oporto', '11975130187', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Patrikson', '11956101555', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Pri Carotta', '11988383783', 'priscilacarotta', '', '', NULL, 'P', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 535.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 535.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Rachel Generosa', '', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Regina Gomes', '11 98483-2585', '', '', '', '1989-03-03'::date, 'Top P shorts M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 141.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 141.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Renata Reis', '11 99945-5389', '@renatareisadv', '', '', '1982-03-24'::date, 'M', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Renata Sales Meyer', '11979588587', '', '', '', '1980-12-13'::date, 'p', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Romulo esposo Tati Campos', '11 91700-0101', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 141.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 141.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Rosangela', '11999410195', '', '', '', NULL, 'Top G, shorts M. Prefere mais cumprido', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 580.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 580.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Samanta Albertini', '11 99710-8208', '', '', '', NULL, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 99.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 99.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Sara Portuense', '11974233455', '', '', '', '1960-06-05'::date, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Talita Merloti', '11953096140', 'talitamerloti', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Tarsila Bondança', '11998539333', '', '', '', NULL, '', 'Esposa Marquinhos Coach') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Tati Campos', '11 95999-1346', '', '', '', '1986-03-25'::date, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 407.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 407.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Taty Sacramento', '11988036088', 'tatysalvasacramento', '', '', NULL, 'm', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 444.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 444.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Thainá Gonçalves', '11992884238', 'thainagoncalvess', '', '', '1995-10-12'::date, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 99.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 99.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Thais Biazini', '11 97310-3749', 'mais.um.dia.do.processo', '', '', '1980-02-22'::date, '', '') RETURNING id INTO v_customer_id;

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Thais Chong', '11930907059', '_thaischong', '', '', NULL, 'G', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 868.15, 'legacy_import', 'completed', 'Importação de Histórico: R$ 868.15');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Thatiane Bertolacini', '35 99888-8482', '', '', '', NULL, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 220.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 220.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Valéria Araújo', '11 99803-0042', '@valeria_araujo.silva', '', '', NULL, 'M', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 189.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 189.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Vanessa Morais', '11930114937', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, 485.0, 'legacy_import', 'completed', 'Importação de Histórico: R$ 485.0');

  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, 'Yasmin', '11974018332', '', '', '', NULL, '', '') RETURNING id INTO v_customer_id;

END $$;
