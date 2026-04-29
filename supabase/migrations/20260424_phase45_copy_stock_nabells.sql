-- ============================================
-- COPIA DE ESTOQUE: Team WOD Brasil -> NaBell's
-- Source owner_id: 8e14d996-dae6-4ed6-9253-e853edbf45e6
-- Dest owner_id: d6a4d4e9-09a8-46f0-ba46-5168dcd8ef84
-- Gerado em: 2026-04-24T21:03:17.241Z
-- ============================================

DO $$
DECLARE
  dest_owner uuid := 'd6a4d4e9-09a8-46f0-ba46-5168dcd8ef84'::uuid;
  new_cat_0 uuid;
  new_cat_1 uuid;
  new_cat_2 uuid;
  new_cat_3 uuid;
  new_subcat_0 uuid;
  new_subcat_1 uuid;
  new_subcat_2 uuid;
  new_subcat_3 uuid;
  new_subcat_4 uuid;
  new_subcat_5 uuid;
  new_subcat_6 uuid;
  new_subcat_7 uuid;
  new_subcat_8 uuid;
  new_subcat_9 uuid;
  new_subcat_10 uuid;
  new_subcat_11 uuid;
  new_prod_0 uuid;
  new_prod_1 uuid;
  new_prod_2 uuid;
  new_prod_3 uuid;
  new_prod_4 uuid;
  new_prod_5 uuid;
  new_prod_6 uuid;
  new_prod_7 uuid;
  new_prod_8 uuid;
  new_prod_9 uuid;
  new_prod_10 uuid;
  new_prod_11 uuid;
  new_prod_12 uuid;
  new_prod_13 uuid;
  new_prod_14 uuid;
  new_prod_15 uuid;
  new_prod_16 uuid;
  new_prod_17 uuid;
  new_prod_18 uuid;
  new_prod_19 uuid;
  new_prod_20 uuid;
  new_prod_21 uuid;
  new_prod_22 uuid;
  new_prod_23 uuid;
  new_prod_24 uuid;
  new_prod_25 uuid;
  new_prod_26 uuid;
  new_prod_27 uuid;
  new_prod_28 uuid;
  new_prod_29 uuid;
  new_prod_30 uuid;
  new_prod_31 uuid;
  new_prod_32 uuid;
  new_prod_33 uuid;
  new_prod_34 uuid;
  new_prod_35 uuid;
  new_prod_36 uuid;
  new_prod_37 uuid;
  new_prod_38 uuid;
  new_prod_39 uuid;
  new_prod_40 uuid;
  new_prod_41 uuid;
  new_prod_42 uuid;
  new_prod_43 uuid;
  new_prod_44 uuid;
  new_prod_45 uuid;
  new_prod_46 uuid;
  new_prod_47 uuid;
  new_prod_48 uuid;
  new_prod_49 uuid;
  new_prod_50 uuid;
  new_prod_51 uuid;
  new_prod_52 uuid;
  new_prod_53 uuid;
  new_prod_54 uuid;
  new_prod_55 uuid;
  new_prod_56 uuid;
  new_prod_57 uuid;
  new_prod_58 uuid;
  new_prod_59 uuid;
  new_prod_60 uuid;
  new_prod_61 uuid;
  new_prod_62 uuid;
  new_prod_63 uuid;
  new_prod_64 uuid;
  new_prod_65 uuid;
  new_prod_66 uuid;
  new_prod_67 uuid;
  new_prod_68 uuid;
  new_prod_69 uuid;
  new_prod_70 uuid;
  new_prod_71 uuid;
  new_prod_72 uuid;
  new_prod_73 uuid;
  new_prod_74 uuid;
  new_prod_75 uuid;
  new_prod_76 uuid;
  new_prod_77 uuid;
  new_prod_78 uuid;
  new_prod_79 uuid;
  new_prod_80 uuid;
  new_prod_81 uuid;
  new_prod_82 uuid;
  new_prod_83 uuid;
  new_prod_84 uuid;
  new_prod_85 uuid;
  new_prod_86 uuid;
  new_prod_87 uuid;
  new_prod_88 uuid;
  new_prod_89 uuid;
  new_prod_90 uuid;
  new_prod_91 uuid;
  new_prod_92 uuid;
  new_prod_93 uuid;
  new_prod_94 uuid;
  new_prod_95 uuid;
  new_prod_96 uuid;
  new_prod_97 uuid;
  new_prod_98 uuid;
  new_prod_99 uuid;
  new_prod_100 uuid;
  new_prod_101 uuid;
  new_prod_102 uuid;
  new_prod_103 uuid;
  new_prod_104 uuid;
  new_prod_105 uuid;
  new_prod_106 uuid;
  new_prod_107 uuid;
  new_prod_108 uuid;
  new_prod_109 uuid;
  new_prod_110 uuid;
  new_prod_111 uuid;
  new_prod_112 uuid;
  new_prod_113 uuid;
  new_prod_114 uuid;
  new_prod_115 uuid;
  new_prod_116 uuid;
  new_prod_117 uuid;
  new_prod_118 uuid;
  new_prod_119 uuid;
  new_prod_120 uuid;
  new_prod_121 uuid;
  new_prod_122 uuid;
  new_prod_123 uuid;
  new_prod_124 uuid;
  new_prod_125 uuid;
  new_prod_126 uuid;
  new_prod_127 uuid;
  new_prod_128 uuid;
  new_prod_129 uuid;
  new_prod_130 uuid;
  new_prod_131 uuid;
  new_prod_132 uuid;
  new_prod_133 uuid;
  new_prod_134 uuid;
  new_prod_135 uuid;
  new_prod_136 uuid;
  new_prod_137 uuid;
  new_prod_138 uuid;
  new_prod_139 uuid;
  new_prod_140 uuid;
  new_prod_141 uuid;
  new_prod_142 uuid;
  new_prod_143 uuid;
  new_prod_144 uuid;
  new_prod_145 uuid;
  new_prod_146 uuid;
  new_prod_147 uuid;
  new_prod_148 uuid;
  new_prod_149 uuid;
  new_prod_150 uuid;
  new_prod_151 uuid;
  new_prod_152 uuid;
  new_prod_153 uuid;
  new_prod_154 uuid;
  new_prod_155 uuid;
  new_prod_156 uuid;
  new_prod_157 uuid;
  new_prod_158 uuid;
  new_prod_159 uuid;
  new_prod_160 uuid;
  new_prod_161 uuid;
  new_prod_162 uuid;
  new_prod_163 uuid;
  new_prod_164 uuid;
  new_prod_165 uuid;
  new_prod_166 uuid;
  new_prod_167 uuid;
  new_prod_168 uuid;
  new_prod_169 uuid;
  new_prod_170 uuid;
  new_prod_171 uuid;
  new_prod_172 uuid;
  new_prod_173 uuid;
  new_prod_174 uuid;
  new_prod_175 uuid;
  new_prod_176 uuid;
  new_prod_177 uuid;
  new_prod_178 uuid;
  new_prod_179 uuid;
  new_prod_180 uuid;
  new_prod_181 uuid;
  new_prod_182 uuid;
  new_prod_183 uuid;
  new_prod_184 uuid;
  new_prod_185 uuid;
  new_prod_186 uuid;
  new_prod_187 uuid;
  new_prod_188 uuid;
  new_prod_189 uuid;
  new_prod_190 uuid;
  new_prod_191 uuid;
BEGIN

  -- STEP 1: Copiar Categorias
  INSERT INTO public.categories (owner_id, name) SELECT dest_owner, name FROM public.categories WHERE id = '04e851eb-3483-420c-bdfc-7b91ef3d02a1' RETURNING id INTO new_cat_0;
  INSERT INTO public.categories (owner_id, name) SELECT dest_owner, name FROM public.categories WHERE id = '5ebf4dd7-744b-471c-bc31-0c0d6a883fac' RETURNING id INTO new_cat_1;
  INSERT INTO public.categories (owner_id, name) SELECT dest_owner, name FROM public.categories WHERE id = '92dbe395-0bef-424b-b26d-33c2a79553e5' RETURNING id INTO new_cat_2;
  INSERT INTO public.categories (owner_id, name) SELECT dest_owner, name FROM public.categories WHERE id = '3a88a012-2e09-434a-a3fa-7c9fb20c33eb' RETURNING id INTO new_cat_3;

  -- STEP 2: Copiar Subcategorias
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_0, name FROM public.subcategories WHERE id = 'bbe19f33-01df-4f36-923d-45551b4cc7e1' RETURNING id INTO new_subcat_0;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_0, name FROM public.subcategories WHERE id = '3d17b56e-7fee-4109-8bcd-d6d536350854' RETURNING id INTO new_subcat_1;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_0, name FROM public.subcategories WHERE id = 'c987ffce-4c85-442a-8c22-5fbf19c47149' RETURNING id INTO new_subcat_2;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_0, name FROM public.subcategories WHERE id = 'f181413c-6127-491a-8355-2da5219295d7' RETURNING id INTO new_subcat_3;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_1, name FROM public.subcategories WHERE id = '2485ab04-c79e-4f6a-ba9b-22bad23c8e9c' RETURNING id INTO new_subcat_4;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_0, name FROM public.subcategories WHERE id = '51b5e8ef-46bc-4d0b-b138-6491db5d1cff' RETURNING id INTO new_subcat_5;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_2, name FROM public.subcategories WHERE id = 'c39b3e3f-085e-4788-84a6-614d598635f4' RETURNING id INTO new_subcat_6;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_3, name FROM public.subcategories WHERE id = '2c716dc4-8ebf-410d-a4b1-2be12f24ccf0' RETURNING id INTO new_subcat_7;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_3, name FROM public.subcategories WHERE id = '89419b1e-5220-4d20-970a-fb17f81636c0' RETURNING id INTO new_subcat_8;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_1, name FROM public.subcategories WHERE id = '7f40c487-ab61-4a30-9151-bef0cb65b165' RETURNING id INTO new_subcat_9;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_0, name FROM public.subcategories WHERE id = 'bbb5d5e8-a8d3-43a9-8614-fef6a4fde15d' RETURNING id INTO new_subcat_10;
  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, new_cat_2, name FROM public.subcategories WHERE id = 'e0bed99b-c3bd-4d2f-88d0-924c4c74c8d9' RETURNING id INTO new_subcat_11;

  -- STEP 3: Copiar Produtos (192 total)
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Carol Azul ', 69, 120, NULL, NULL, NULL, NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, '', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_0;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'MACAQUINHO BELLA PINK', 82.47, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/efb92ea0-d484-453d-bb31-78e22cf5f69b/1771613926116_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/efb92ea0-d484-453d-bb31-78e22cf5f69b/1771613926605_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/efb92ea0-d484-453d-bb31-78e22cf5f69b/1771613927094_3.jpeg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_1;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Maysa Aeris', 101.94, 169.9, 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2299/01-cropped-maysa-aeris.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2302/04-cropped-maysa-aeris.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2301/03-cropped-maysa-aeris.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, 'O Cropped Maysa Aeris foi desenvolvido para oferecer conforto, sustentação e estilo em uma peça moderna e versátil. Sua modelagem proporciona ajuste anatômico ao corpo, valorizando a silhueta e garantindo liberdade de movimento para diferentes tipos de treino. Com toque macio e excelente elasticidade, a peça proporciona conforto prolongado e ótima adaptação ao corpo durante o uso. O Cropped Maysa Aeris é ideal para compor looks fitness sofisticados e também combina perfeitamente com produções casuais para o dia a dia. ATENÇÃO: Compressão média. Modelo veste 38/P | Altura: 1,74 m | Busto: 88 cm | Cintura: 67 cm | Quadril: 103 cm. Benefícios: • Ajuste anatômico que valoriza o corpo • Sustentação e conforto durante o uso • Liberdade de movimento para diferentes atividades • Boa cobertura e segurança • Toque macio e excelente elasticidade. Informações Técnicas: Produto: Cropped Maysa Aeris • Tamanhos: P | M | G | GG • Composição: 84% poliamida | 16% elastano • Gramatura: 285 g/m² • Peso médio: 113 g. Cuidados: • Lavar à mão ou na máquina em processo suave • Usar sabão neutro • Não deixar de molho • Não alvejar • Secar à sombra • Não passar • Não realizar limpeza a seco.', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_2;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'conjunto amarelo', 83.94, 139.9, NULL, NULL, NULL, NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, '', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_3;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'conjunto amarelo ', 83.94, 139.9, NULL, NULL, NULL, NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, '', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_4;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Snatch Dry Marinho', 95, 180, NULL, NULL, NULL, NULL, new_cat_1, new_subcat_4, NULL, 'active', 6, 'Dry Azul Marinho', NULL, 0, 'snatch', 'marinho', 'curta', '', '', '', '0', true) RETURNING id INTO new_prod_5;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging Lavanda', 101, 195, 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.3932604190572908.webp', NULL, NULL, NULL, new_cat_0, new_subcat_5, NULL, 'active', 0, '', NULL, 0, '', 'lavanda', '', '', '', '', '0', false) RETURNING id INTO new_prod_6;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Amanda Lavanda', 76, 145, 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.6318814950038776.webp', 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.528379990021413.webp', NULL, NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, '', NULL, 0, 'amanda', 'lavanda', '', '', '', '', '0', false) RETURNING id INTO new_prod_7;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Munhequeira Seca Suor preta ', 22, 49, '-', '-', '-', NULL, new_cat_2, new_subcat_6, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_8;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Lavanda c/ viés branco', 76, 145, 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.9659684984731834.webp', 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.24608079966009688.webp', NULL, NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, '', NULL, 0, 'com viés ', 'lavanda ', '', '', '', '', '0', false) RETURNING id INTO new_prod_9;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAPPUCCINO POTE S/AÇUCAR TRADICIONAL 350G', 25, 45, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895610366-trad_s_a__ucar_1-png-354bc8615404c4f5fb17598665383579-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895611082-trad_s_a__ucar_3-png-a1b5bfb5b9dfba297017598665437396-480-0.webp', '-', NULL, new_cat_3, new_subcat_7, NULL, 'active', 0, 'CAPPUCCINO POTE S/AÇUCAR TRADICIONAL 350G', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_10;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'MUSCLE COFFEE 220GR', 47, 93, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1526645301-453-png-c3d984bdc616871f2117218527860245-480-0.webp', '-', '-', NULL, new_cat_3, new_subcat_8, NULL, 'active', 3, 'MUSCLE COFFEE 220GR', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_11;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Squat Preta', 95, 180, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1528173933-12-png-58cb6e1c4c9ad85e8617220203188562-480-0.webp', '-', '-', NULL, new_cat_1, new_subcat_4, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-268852997">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_12;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Las Vegas Preto C/ Xicara', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1930745797-32-png-ed1779a64a528b1ce117630023356380-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1930745811-34-png-1784ba80d17d800f7d17636026010596-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1930745799-33-png-67787d5cffab3505c117636025893055-480-0.webp', NULL, new_cat_0, new_subcat_3, NULL, 'active', 3, 'class="item-description text-center" data-store="product-item-info-222464424">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_13;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Carol Preto C/ Etiqueta', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1525403105-47-png-5d17ca1ead4bdad62217218504795597-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1525403210-5-png-78b1c8a70e878451fa17217465128778-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-222464211">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_14;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Dani Expresso/Canela', 83.94, 139, 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2269/17-top-dani-expresso-canela.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/02/produto/2241/10-top-dani-expresso-canela.jpeg', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'O Top Dani Expresso/Canela combina conforto, sustentação e design funcional em uma peça versátil para treinos e uso diário. Sua modelagem foi desenvolvida para valorizar a silhueta, oferecendo ajuste anatômico, firmeza e liberdade de movimento durante qualquer atividade.

Com excelente elasticidade e toque macio, proporciona segurança ao longo do uso, baixa transparência e alta durabilidade. A combinação sofisticada das cores expresso e canela traz elegância e versatilidade, permitindo composições que vão do treino às produções casuais com atitude.

ATENÇÃO:

Compressão média.
Modelo veste P | Altura: 1,70 m | Busto: 88 cm | Cintura: 64 cm | Quadril: 94 cm.

Benefícios:
• Sustentação confortável
• Ajuste anatômico
• Liberdade de movimento
• Baixa transparência
• Conforto durante todo o uso

Informações Técnicas:
• Produto: Top Dani
• Tamanhos: P | M | G | GG
• Composição: 84% poliamida | 16% elastano
• Gramatura: 280 g/m²
• Peso médio: 60 g

Cuidados:
• Lavar à mão ou na máquina em processo suave
• Usar sabão neutro
• Não deixar de molho
• Não alvejar
• Secar à sombra
• Não passar
• Não realizar limpeza a seco', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_15;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Carol Marrocos C/ etiqueta', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1525372391-35-png-aecb2ae12c8c8a8f0c17218503242779-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1525372502-38-png-79d72d88e670614d3d17217463583394-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1525372485-37-png-a07515d52dc5f9131917217463494651-480-0.webp', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-256030304">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_16;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging Sabrina Expresso/Canela', 143.94, 227, 'https://inmoovse.cdn.magazord.com.br/img/2026/02/produto/2243/12-top-dani-expresso-canela.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/02/produto/2244/13-top-dani-expresso-canela.jpeg', '-', NULL, new_cat_0, new_subcat_5, NULL, 'active', 0, 'A Legging Sabrina Expresso/Canela combina conforto, sustentação e design funcional em uma peça versátil para treinos e uso diário. Sua modelagem foi desenvolvida para valorizar a silhueta, oferecendo ajuste anatômico, firmeza e liberdade de movimento em qualquer atividade.

Com excelente elasticidade e toque macio, proporciona segurança durante o uso, baixa transparência e alta durabilidade. A combinação sofisticada das cores expresso e canela traz elegância e versatilidade, permitindo composições que vão do treino às produções casuais com atitude.

**ATENÇÃO:**
Compressão média.
Modelo veste P | Altura: 1,70 m | Busto: 88 cm | Cintura: 64 cm | Quadril: 94 cm.

**Benefícios:**
• Sustentação e firmeza na medida certa
• Ajuste anatômico que valoriza a silhueta
• Liberdade de movimento
• Baixa transparência
• Conforto durante todo o uso

**Informações Técnicas:**
• Produto: Legging Sabrina
• Tamanhos: P | M | G | GG
• Composição: 84% poliamida | 16% elastano
• Gramatura: 280 g/m²
• Peso médio: 197 g

**Cuidados:**
• Lavar à mão ou na máquina em processo suave
• Usar sabão neutro
• Não deixar de molho
• Não alvejar
• Secar à sombra
• Não passar
• Não realizar limpeza a seco', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_17;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Bruna Jade', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960745060-27-png-53f7a9ea8093a1ca8a17652140336204-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, 'class="item-description text-center" data-store="product-item-info-222463478">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_18;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Maysa Aeris', 83.94, 132.91, 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2316/01-top-maysa-aeris.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2311/02-shorts-tais-aeris.jpeg', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'O Top Maysa Aeris foi criado para proporcionar sustentação, conforto e segurança durante os treinos. Sua modelagem anatômica se ajusta perfeitamente ao corpo, oferecendo firmeza e estabilidade para diferentes níveis de atividade física.

Com toque macio e excelente elasticidade, garante conforto ao longo do uso e ótima adaptação ao corpo. O Top Maysa Aeris é uma peça versátil que une funcionalidade e estilo, ideal para compor looks fitness modernos e práticos.

**ATENÇÃO:**
Compressão média.
Modelo veste 38/P | Altura: 1,74 m | Busto: 88 cm | Cintura: 67 cm | Quadril: 103 cm.

**Benefícios:**
• Sustentação e segurança durante os treinos
• Ajuste anatômico que se adapta ao corpo
• Conforto prolongado ao longo do uso
• Liberdade de movimento
• Toque macio e excelente elasticidade

**Informações Técnicas:**
• Produto: Top Maysa Aeris
• Tamanhos: P | M | G | GG
• Composição: 84% poliamida | 16% elastano
• Gramatura: 285 g/m²
• Peso médio: 94 g', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_19;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Duda Cinza Prisma', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960753172-37-png-e0daad22b82944863b17652139960851-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960753390-36-png-4cd098a5ea1fd585ec17655346137648-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 5, 'class="item-description text-center" data-store="product-item-info-280570268">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_20;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Pandora Aeris', 83.94, 139.9, 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2301/03-cropped-maysa-aeris.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/03/produto/2307/03-legging-dani-aeris.jpeg', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'O Shorts Pandora Aeris foi desenvolvido para oferecer conforto, sustentação e liberdade de movimento em todos os momentos do treino. Sua modelagem anatômica se ajusta perfeitamente ao corpo, valorizando as curvas e garantindo segurança durante atividades de diferentes intensidades. Com toque macio e excelente elasticidade, proporciona conforto prolongado e boa cobertura durante o uso. O Shorts Pandora Aeris é uma peça versátil que une funcionalidade e estilo, ideal para compor looks fitness modernos e práticos para o dia a dia. Atenção: Compressão média.', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_21;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Amanda Cinza Chumbo', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960768314-38-png-050858b434b05d5f8f17652145532137-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-295721732">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_22;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Duda Castanho Wonder', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1892183751-12-png-0fa285d746965c7ae817594593792099-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1892183759-13-png-44525aebd121df1f8617610519540638-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1892183755-1-png-de55e382e28d41ee3917610519457107-480-0.webp', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-297830745">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_23;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Thaly Off White', 76, 145, '-', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_24;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Bruna Vermelho Asia', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2002912771-28-png-aa2354d91f45f979b717694777396170-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2002912787-29-png-7bec4b6c1731e13eaa17701217156239-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 3, 'class="item-description text-center" data-store="product-item-info-264023755">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_25;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Virginia Expresso', 161.94, 259.9, 'https://inmoovse.cdn.magazord.com.br/img/2026/02/produto/2236/05-top-dani-expresso-canela.jpeg', 'https://inmoovse.cdn.magazord.com.br/img/2026/02/produto/2238/07-top-dani-expresso-canela.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, 'O Macaquinho Virginia Expresso combina conforto, sustentação e design funcional em uma peça versátil para treinos e uso diário. Sua modelagem foi desenvolvida para valorizar a silhueta, oferecendo ajuste anatômico, firmeza e liberdade de movimento durante qualquer atividade.

Com excelente elasticidade e toque macio, proporciona segurança ao longo do uso, baixa transparência e alta durabilidade. Sua tonalidade expresso traz elegância e versatilidade, permitindo composições modernas tanto para atividades físicas quanto para produções casuais com personalidade.

**ATENÇÃO:**
Compressão média.
Modelo veste P | Altura: 1,70 m | Busto: 88 cm | Cintura: 64 cm | Quadril: 94 cm.

**Benefícios:**
• Sustentação e firmeza na medida certa
• Ajuste anatômico que valoriza a silhueta
• Liberdade de movimento
• Baixa transparência
• Conforto durante todo o uso

**Informações Técnicas:**
• Produto: Macaquinho Virginia
• Tamanhos: P | M | G | GG
• Composição: 84% poliamida | 16% elastano
• Gramatura: 280 g/m²
• Peso médio: 175 g', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_26;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macacão Peônia Branco ', 137.45, 249, 'https://www.bechose.com.br/wp-content/uploads/2026/03/branco_macaquinho_peonia-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/branco_macaquinho_peonia-02.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/branco_macaquinho_peonia-04.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_27;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Lótus Rosa Pink Canelado', 82.42, 149.9, 'https://www.bechose.com.br/wp-content/uploads/2026/03/pink_shorts_lotus-01-e1774478883159-300x462.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/pink_gripfit.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/pink_top_shorts-02.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'O **Shorts Rosa Pink Canelado** foi desenvolvido para unir conforto, praticidade e um design moderno, ideal para quem busca uma peça versátil para o dia a dia ou momentos de movimento leve. Sua modelagem se ajusta ao corpo com naturalidade, proporcionando segurança e liberdade em todos os movimentos.

Confeccionado em tecido canelado, o shorts oferece toque macio, boa elasticidade e ajuste confortável, garantindo bem-estar durante o uso prolongado.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_28;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Regata Now Lavanda ', 55, 99, 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.7721788102121377.webp', 'https://vvvuqmhozcsnvwntjfcr.supabase.co/storage/v1/object/public/product-images/0.046837423464357264.webp', NULL, NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_29;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP ARIANE LAVANDA C/ VIÉS', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056316429-33-png-529dd8dec9709478c317743179776682-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056316435-35-png-6b085f24ab014639fd17743179905099-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_30;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAMISETA MASC OVERSIZED BRANCA FRONT SQUAT', 55, 99, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/30-162ee5b9df466db3af17725042629038-480-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 0, 'CARACTERÍSTICAS PRINCIPAIS:

MODELAGEM OVERSIZED: PROPORCIONA UM CAIMENTO SOLTO E DESPOJADO, GARANTINDO CONFORTO E ESTILO EM QUALQUER LOOK.

CONFORTO NATURAL: CONFECCIONADA EM 100% ALGODÃO, OFERECE MACIEZ AO TOQUE E RESPIRABILIDADE, IDEAL PARA TODAS AS ESTAÇÕES.

DURABILIDADE: O ALGODÃO DE ALTA QUALIDADE ASSEGURA RESISTÊNCIA E LONGA VIDA ÚTIL À PEÇA, MESMO COM USO FREQUENTE.

MODELO VESTE: P

A CAMISETA OVERSIZED É A PEÇA INDISPENSÁVEL PARA QUEM BUSCA UNIR CONFORTO, FUNCIONALIDADE E ESTILO EM UMA SÓ ESCOLHA.', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_31;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'MACACÃO BRUNA ESMERALDA', 120, 240, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056314778-macacao_2-png-1d60f9f1e10e6c595c17743179225761-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056314786-macacao_5-png-dce253ded7672c78cf17743179392399-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056314784-macacao_4-png-b28e5afdf5c6bebdb017743179352135-480-0.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_32;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS THALI LAVANDA', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2056316829-47-png-15a472cf0dc67fcbf417743189283515-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056316831-lavanda_carol_5-png-41acb351dbfac9b76217743189334367-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056316833-48-png-f0e465a9ad4645a90317743189375341-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_33;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP CAROL ESMERALDA', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2056314741-carol-png-e360bbab413f9683d317743179067519-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056314754-carol___thaly_3-png-f3f1fb06385e9fb42417743179163037-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 5, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_34;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS THALI ESMERALDA', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2056313875-carol___thaly_4-png-03d71b88d76709db3017743178531137-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056313885-carol___thaly_2-png-dc4accb98fd8b46e6e17743178695783-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056313881-carol___thaly_3-png-b0ce96c0f1b81e7c6a17743178655468-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_35;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS EMPINA BUMBUM ESMERALDA', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056313731-es_empina_01-png-bf0c03ed38efc11b1917743178192256-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056313735-es_empina_03-png-7ba6dedd33ec16c59817743178286403-480-0.webp', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 4, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_36;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAMISETA MASC AERODRY ESMERALDA', 55, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315834-78-png-efca000f74596823aa17743177102607-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315863-79-png-09c7cf7d7f558be48617743177143203-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315920-8-png-57a48a89516c50712217743177182212-480-0.webp', NULL, new_cat_1, new_subcat_9, NULL, 'active', 4, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_37;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'BERMUDA SQUAT ESMERALDA', 95, 180, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315750-73-png-d622684cec9116d89417743176906707-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315752-72-png-f1a68dcd44ad74486d17743176946112-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/tmp_b64_0972528a-12f3-4b46-a531-4e7d9336db78_4843252_5198828-6dfaeee69a54c97c0917743195587576-480-0.webp', NULL, new_cat_1, new_subcat_4, NULL, 'active', 2, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_38;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP DALIA PRETO CANELADO', 82.45, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/02/Top-Canelado-Preto-4.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/Top-Canelado-Preto-2.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 3, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_39;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'REGATA NOW ESMERALDA', 55, 99, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315722-es_empina_03__4-png-a2d79d3f1893cc5e0d17743176846448-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2056315718-es_empina_03__2-png-8cbdceb31556797cad17743176748309-480-0.webp', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_40;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS LOTUS PRETO CANELADO', 82.45, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/02/Shorts-Lotus-Preto-4.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/Shorts-Lotus-Preto-2.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/Shorts-Lotus-Preto-3.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_41;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'LEGGING HIBISCO ROSA SATIN', 137.45, 250, 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_legging_hibisco-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_legging_hibisco-02.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_legging_hibisco-04.webp', NULL, new_cat_0, new_subcat_5, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_42;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP HIBISCO ROSA SATIN', 82.45, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_top_hibisco-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_top_hibisco-03.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_top_hibisco-03.1.webp', NULL, new_cat_0, new_subcat_3, NULL, 'active', 3, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_43;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP VIOLETA ROSA SATIN', 82.45, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_top_violeta-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_top_violeta-02.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_top_violeta-03.1.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_44;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS HIBISCO ROSA SATIN', 82.45, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_shorts_hibisco-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_shorts_hibisco-03.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/satin_grip.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 5, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_45;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'MACAQUINHO VIOLETA ROSA SATIM', 137.45, 249, 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_macaquinho_violeta-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_macaquinho_violeta-02.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/Satin_macaquinho_violeta-03.1.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_46;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'MACAQUINHO VIOLETA ROSA PINK CANELADO', 137.45, 249, 'https://www.bechose.com.br/wp-content/uploads/2026/03/pink_macaquinho_violeta-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/pink_macaquinho_violeta-03.2.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/pink_macaquinho_violeta-03.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 4, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_47;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Duda Off White Wonder', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1892183210-24-png-76ff6904ea0cd01d6e17594591112909-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1892183216-26-png-bf430ce3191aa2f71c17610519298165-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-295721579">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_48;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Soft Areia', 90, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8409fef4-c6a7-4eaf-9d68-d5b9ae77f0fd/1774634765099_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8409fef4-c6a7-4eaf-9d68-d5b9ae77f0fd/1774634766255_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8409fef4-c6a7-4eaf-9d68-d5b9ae77f0fd/1774634766949_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_49;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Power Preto', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/4b989558-9024-492d-a0a2-48dabfcb389a/1774634682499_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/4b989558-9024-492d-a0a2-48dabfcb389a/1774634683992_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/4b989558-9024-492d-a0a2-48dabfcb389a/1774634684694_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_50;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Power Marrom Café', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f4e51918-0920-440d-b689-ad1b96136eff/1774634579976_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f4e51918-0920-440d-b689-ad1b96136eff/1774634581535_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f4e51918-0920-440d-b689-ad1b96136eff/1774634582309_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_51;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Joy Preto', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/3e007136-ecaf-4d93-91e7-7bc66c6cdcf4/1774634477503_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/3e007136-ecaf-4d93-91e7-7bc66c6cdcf4/1774634478681_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/3e007136-ecaf-4d93-91e7-7bc66c6cdcf4/1774634479446_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_52;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Pump Castor', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1ea0e09e-e111-48bc-b13e-469e65dbaffc/1774634282122_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1ea0e09e-e111-48bc-b13e-469e65dbaffc/1774634283397_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1ea0e09e-e111-48bc-b13e-469e65dbaffc/1774634284108_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_53;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Pump Cinza Chumbo ', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/3fa55cfa-65da-4d79-a77c-c3c0b9994d4a/1774634227649_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/3fa55cfa-65da-4d79-a77c-c3c0b9994d4a/1774634228788_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/3fa55cfa-65da-4d79-a77c-c3c0b9994d4a/1774634229433_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_54;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Lele Rosé Wonder', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1892180202-1-png-08813b9d80e836f66c17594590865213-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1892180206-4-png-c07ede39dae4c6098517594590957803-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-295721514">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_55;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Hortênsia Rosa Pink', 44.97, 149.9, 'https://www.bechose.com.br/wp-content/uploads/2025/04/Pink_top_Hortencia-01-682x1024.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/04/Pink_top_Hortencia-04-scaled.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/04/Pink_top_Hortencia-03-scaled.jpg', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'O Top poliamida de qualidade Hortência Rosa Pink da Bechose é uma peça vibrante que une estilo e funcionalidade. Confeccionado em tecido de alta qualidade, oferece conforto e ótima sustentação, sendo ideal tanto para treinos quanto para o dia a dia. Sua modelagem versátil garante liberdade de movimento e confiança em todas as atividades. A cor rosa pink adiciona um toque de personalidade e energia ao visual, tornando-o perfeito para quem busca se destacar com elegância.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_56;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Hortência Preto Glow', 82.45, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/03/preto_top_hortensia-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/preto_top_hortensia-02.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/preto_top_hortensia-03.webp', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_57;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Hortência Papaya', 53.96, 130, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f5cf19f2-b05e-4633-a9ea-aecfcc3105e2/1774476332482_3.jpg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f5cf19f2-b05e-4633-a9ea-aecfcc3105e2/1774476330540_1.jpg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f5cf19f2-b05e-4633-a9ea-aecfcc3105e2/1774476331726_2.jpg', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_58;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Hortência Azul Santorini', 26.98, 135, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/9e5580e4-f012-4196-8177-1af376b8771b/1774467905008_2.jpg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/9e5580e4-f012-4196-8177-1af376b8771b/1774467904369_1.jpg', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_59;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Hortênsia Fúcsia', 26.98, 149.9, 'https://www.bechose.com.br/wp-content/uploads/2025/03/Fucsia_top_ortencia-01.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/03/Fucsia_top_ortencia-04.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/03/Fucsia_top_ortencia-01-300x450.jpg', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'O Top Hortência Fúcsia da Bechose é uma peça vibrante que une estilo e funcionalidade.Confeccionado em tecido de alta qualidade, oferece ótima sustentação e conforto, ideal tanto para treinos quanto para o uso diário.Seu design moderno proporciona liberdade de movimento e confiança em todas as atividades.Disponível nos tamanhos P, M, G e GG, é perfeito para quem busca uma peça alegre e versátil.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_60;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Violeta Preto Shine', 80.43, 159.9, 'https://www.bechose.com.br/wp-content/uploads/2026/03/7Q9A7036-Shorts-5.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/7Q9A7036-Shorts-1.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/03/7Q9A7036-Shorts-2.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, 'Shorts Violeta Preto Shine', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_61;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS BEL C/ BOLSO PRETO BLACKOUT', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/5-57bd07b50828fd936c17725042956913-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/8-6e8535fe58185e3db917725042897064-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/12-0c32d50f510f833b0b17725042988804-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'CARACTERÍSTICAS PRINCIPAIS:

DESIGN LONGO E FUNCIONAL: SEU COMPRIMENTO MAIOR OFERECE MAIOR COBERTURA E SEGURANÇA DURANTE OS MOVIMENTOS INTENSOS, SEM COMPROMETER A LIBERDADE DE MOVIMENTO ESSENCIAL PARA O CROSSFIT.

AJUSTE CONFORTÁVEL: CONFECCIONADO PARA SE ADAPTAR AO CORPO, GARANTINDO UM AJUSTE FIRME E FLEXÍVEL QUE ACOMPANHA OS MOVIMENTOS DINÂMICOS DO TREINO, OFERECENDO SUPORTE SEM APERTAR.

COMPRIMENTO IDEAL: O DESIGN DE COMPRIMENTO MAIS LONGO OFERECE COBERTURA EXTRA, MANTENDO O CONFORTO E A ESTABILIDADE DURANTE OS AGACHAMENTOS, SALTOS E OUTROS MOVIMENTOS DO CROSSFIT.

BOLSO PRÁTICO: COM BOLSO NA LATERAL DA PERNA É PERFEITO PARA ARMAZENAR PEQUENOS ITENS, COMO CHAVES OU CELULARES COM SEGURANÇA E FÁCIL ACESSO, SEM ATRAPALHAR SEU DESEMPENHO.

TECIDO BLACKOUT: COM 85% POLIAMIDA E 15% ELASTANO, ESTE MATERIAL OFERECE ALTA ELASTICIDADE, TOQUE MACIO E AJUSTE PERFEITO AO CORPO, PROPORCIONANDO CONFORTO, SEGURANÇA E DESEMPENHO SUPERIOR. CONTA COM ZERO TRANSPARÊNCIA E PROTEÇÃO UV 50+, GARANTINDO MAIS CONFIANÇA E PROTEÇÃO DURANTE OS TREINOS OU NO DIA A DIA.

TECNOLOGIAS:
• EASY CARE: FÁCIL DE LAVAR, SECA RÁPIDO E MANTÉM A ESTRUTURA E A QUALIDADE DO TECIDO MESMO APÓS VÁRIAS LAVAGENS.
• SHAPE INTELIGENTE: MODELA-SE AO CORPO SEM APERTAR, VALORIZANDO A SILHUETA COM CONFORTO E SUSTENTAÇÃO NA MEDIDA CERTA.

MODELO VESTE: P

O SHORTS BEL É A ESCOLHA PERFEITA PARA QUEM PRECISA DE PRATICIDADE, CONFORTO E RESISTÊNCIA EM CADA TREINO.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_62;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED LARA PRETO C/ PRATA', 69, 135, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2016948136-1-png-9344dafdf6f1b663ce17707240255929-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2016948178-2-png-4f1d61cdd6257a80ca17707240308633-480-0.webp', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, 'O Cropped Lara Canelado é a peça ideal para quem busca unir estilo, conforto e alto desempenho durante os treinos mais intensos. Inspirado em tendências dos Estados Unidos. Características principais: Tecido Wonder: Com uma composição de 77% poliamida e 23% elastano, esse tecido possui compressão inteligente, toque macio e brilho acetinado. Sua elasticidade em quatro direções garante conforto térmico e maior durabilidade, com costuras reforçadas para resistência nos treinos. Modelagem Ajustada e Confortável: Projetado para se moldar ao corpo, proporciona liberdade de movimento e suporte durante os exercícios mais desafiadores. Conforto e Respirabilidade: O tecido canelado garante leveza, maciez ao toque e excelente respirabilidade, mantendo o conforto mesmo em treinos puxados. Design com Mangas Curtas: As mangas bem curtas adicionam um toque moderno e versátil, perfeito para quem busca um visual esportivo e fashion. Modelo veste: P Indispensável para atletas de crossfit e amantes de atividades físicas intensas, o Cropped Lara Canelado é a peça que combina praticidade, conforto e design em um só produto. Ideal para quem busca o equilíbrio perfeito entre performance e estilo!', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_63;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging preta c/ boso lateral', 101, 195, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2035517714-2-png-28738142629b8b708b17725040380616-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2035517718-1-png-e215a1367bdc1c208b17725040454323-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2035517720-4-png-709ccd181fa5e6fd6a17725040490673-480-0.webp', NULL, new_cat_0, new_subcat_5, NULL, 'active', 3, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_64;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Over Bina', 65.95, 119.9, 'https://www.bechose.com.br/wp-content/uploads/2026/02/bechose-camiseta-over-fusca-1.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/bechose-camiseta-over-fusca-2.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/bechose-camiseta-over-fusca-3.webp', NULL, new_cat_0, new_subcat_0, NULL, 'active', 3, 'A Camiseta Over Serena Off traz o equilíbrio perfeito entre conforto, qualidade e estilo minimalista. Com modelagem over, ela garante um caimento mais solto e moderno, ideal para compor looks versáteis e atemporais.', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_65;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Bina Rosa Lindo', 82.45, 149, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/e53e682e-5c29-4b52-896c-0dbaa7e6642d/1773449166980_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/e53e682e-5c29-4b52-896c-0dbaa7e6642d/1773449167954_2.jpeg', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 4, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_66;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'MACACAO LUANA PRETO', 120, 240, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/3-61aa12e1595a7ce18c17721165509046-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/4-d76bfe85a2183e69d717721165546200-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2-f4578b89c9c2f70a4017721165635907-480-0.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_67;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Bina Rosa Lindo', 82.45, 149, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/478876b8-bb3e-4594-bb16-0de99be8c77f/1773449219236_1.jpeg', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 4, '-', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_68;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Bina Rosa Lindo', 137.45, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f7d0a86d-033f-4992-9c31-990466499b59/1773449238638_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f7d0a86d-033f-4992-9c31-990466499b59/1773449239481_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f7d0a86d-033f-4992-9c31-990466499b59/1773449240058_3.jpeg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_69;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Mileni Off White Expresso Vermelho', 55, 99, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2002935446-3-png-abefde1f1f34e1ebc017694800506276-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2002935467-32-png-be896ca917b0b1108b17694800548918-480-0.webp', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_70;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Verde Água', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/201a7ebf-95a5-4289-9607-63d1735eb508/1771616033323_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/201a7ebf-95a5-4289-9607-63d1735eb508/1771616033841_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_71;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Verde Militar', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1742022c-078e-4fcf-b570-fd12f39da206/1771615947226_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1742022c-078e-4fcf-b570-fd12f39da206/1771615947777_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1742022c-078e-4fcf-b570-fd12f39da206/1771615948246_3.jpeg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_72;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Cinza Cristal', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/748ba6e2-4cfe-43f9-8272-e0a76e9147a6/1771615891355_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/748ba6e2-4cfe-43f9-8272-e0a76e9147a6/1771615891834_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_73;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Jaqueta corta vento Verde Militar', 60, 129.9, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/37aa5d3d-d130-4bc3-b51d-bfc518bd5271/1771614123700_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/37aa5d3d-d130-4bc3-b51d-bfc518bd5271/1771614124387_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/37aa5d3d-d130-4bc3-b51d-bfc518bd5271/1771614125047_3.jpeg', NULL, new_cat_0, new_subcat_10, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_74;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Violeta Preto Canelado', 136.53, 249, 'https://www.bechose.com.br/wp-content/uploads/2026/02/Macaquinho-viloleta-preto-canelado-1.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/Macaquinho-viloleta-preto-canelado-4.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/Macaquinho-viloleta-preto-canelado-7.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, 'Macaquinho Violeta Preto Canelado', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_75;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peônia Preto Canelado', 136.53, 249, 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_Macaquinho_Peonia-01.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_Macaquinho_Peonia-02.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_Macaquinho_Peonia-10-1.jpg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, 'O Macaquinho Peônia Preto Canelado da Bechose é uma peça que une elegância e conforto. Confeccionado em tecido canelado de alta compressão, proporciona ajuste perfeito e liberdade de movimento. Seu decote nas costas adiciona um toque ousado e sofisticado. Além disso, o material de alta qualidade não marca celulite e possui costuras inteligentes que garantem um caimento impecável. Versátil, pode ser combinado com blazers para um look mais refinado. Disponível na cor preta, é ideal para quem busca estilo e conforto.', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_76;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP PERPÉTUA ELEGANCE PRETO ABSOLUTO', 71.94, 139, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1fa0e38c-1540-4a7d-8ec2-07893f5f10db/1771613811412_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1fa0e38c-1540-4a7d-8ec2-07893f5f10db/1771613811954_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1fa0e38c-1540-4a7d-8ec2-07893f5f10db/1771613812726_3.jpeg', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_77;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP PERPÉTUA CONFORT PRETO ABSOLUTO', 71.94, 139, 'https://www.bechose.com.br/wp-content/uploads/2026/01/top_perpetua_confort_preto-01.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/01/top_perpetua_confort_preto-02.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/01/top_perpetua_confort_preto-05.webp', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_78;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS PERPÉTUA 6" PRETO ABSOLUTO', 71.94, 139, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/004701c2-9187-449e-bfc1-07c14811c168/1771630923610_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/004701c2-9187-449e-bfc1-07c14811c168/1771630924608_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/004701c2-9187-449e-bfc1-07c14811c168/1771630925106_3.jpeg', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_79;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS PERPÉTUA 2" PRETO ABSOLUTO', 71.94, 139, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/2d4d35b8-8b00-46bf-9859-44b034b91760/1771630756450_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/2d4d35b8-8b00-46bf-9859-44b034b91760/1771630757369_2.jpeg', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_80;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Regata Julia Branco', 59.94, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/b6226962-2001-4e79-9c50-e804bae3f6bd/1771613975356_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/b6226962-2001-4e79-9c50-e804bae3f6bd/1771613976034_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/b6226962-2001-4e79-9c50-e804bae3f6bd/1771613976536_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_81;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Viseira PWRD By Cofee', 55, 89, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/a891cabe-01ac-4235-8e1f-1a8553921f4a/1770999980973_1.jpeg', '-', '-', NULL, new_cat_2, new_subcat_11, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_82;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Regata Julia Energia', 59.94, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/a6eb3ee4-2632-40d3-8ea3-4bdf88a4c3fe/1771614008692_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/a6eb3ee4-2632-40d3-8ea3-4bdf88a4c3fe/1771614009167_2.jpeg', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_83;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Boné PWRD Chumbo ', 55, 89, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bb215a02-b177-4cf6-96ed-ca2e0110e15f/1770999837301_1.jpeg', '-', '-', NULL, new_cat_2, new_subcat_11, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_84;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'BONÉ PRETO EUA', 55, 89, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1529020084-1414-jpg-8bc895e9a37af8319917222742800947-480-0.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/cd6a499f-0b9c-45e7-88d8-58b5c148ad3f/1770999770629_1.jpeg', '-', NULL, new_cat_2, new_subcat_11, NULL, 'active', 0, 'BONÉ PRETO EUA', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_85;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Boné PWRD Preto ', 55, 89, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/c69ec1ba-ff3a-4f4f-b204-2c4e5efd148b/1770999916189_1.jpeg', '-', '-', NULL, new_cat_2, new_subcat_11, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_86;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAPPUCCINO POTE TRADICIONAL 400G', 25, 45, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895609755-capp_trad_1-png-7cbc0107b8037ff80717598665208156-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895609760-capp_trad_3-png-c8c5d0382cd2e5e25917598665261382-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895609764-capp_trad_2-png-7be5b1dba2a03c7ecb17598665315686-480-0.webp', NULL, new_cat_3, new_subcat_7, NULL, 'active', 0, 'CAPPUCCINO POTE TRADICIONAL 400G', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_87;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAPPUCCINO POTE AVELÃ 400G', 25, 45, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895612436-capp_avela_1-png-19ea9c24bb917fc1ec17598667173226-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895612484-capp_avela_3-png-599f3268c1643ab0ba17598667228256-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895612515-capp_avela_2-png-0ae26272b0c906859117598667280546-480-0.webp', NULL, new_cat_3, new_subcat_7, NULL, 'active', 0, 'CAPPUCCINO AVELÃ 400G', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_88;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAPPUCCINO POTE AVELÃ S/AÇUCAR 350G', 25, 45, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895613577-avela_s_a__ucar_1-png-cb2b8dfbfe3becfa3717598666926993-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895613623-avela_s_a__ucar_3-png-f842e694ff3515c41117598666983078-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1895613638-avela_s_a__ucar_2-png-72fb118d3f5237fac517598667045250-480-0.webp', NULL, new_cat_3, new_subcat_7, NULL, 'active', 0, 'CAPPUCCINO AVELÃ S/AÇUCAR 350G', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_89;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Prime Canelado Preto ', 70, 189, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/2f213ec0-1b99-43da-a716-299f16877255/1770927934772_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/2f213ec0-1b99-43da-a716-299f16877255/1770927935276_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/2f213ec0-1b99-43da-a716-299f16877255/1770927935746_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_90;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Adapt Liso Marinho ', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/305c1bb9-1942-448e-8a8a-8188b417fc6b/1770927872548_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/305c1bb9-1942-448e-8a8a-8188b417fc6b/1770927873050_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/305c1bb9-1942-448e-8a8a-8188b417fc6b/1770927873518_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_91;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Soft Grafite ', 90, 209, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/e56bb980-c70f-4b2a-a0d5-a370aa3d7e18/1770927751389_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/e56bb980-c70f-4b2a-a0d5-a370aa3d7e18/1770927751864_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/e56bb980-c70f-4b2a-a0d5-a370aa3d7e18/1770927752335_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_92;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Jaqueta Corta Vento Magenta ', 60, 129.9, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/33ee4688-a692-49f1-b3d3-d24ab95d6623/1770927592701_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/33ee4688-a692-49f1-b3d3-d24ab95d6623/1770927593173_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/33ee4688-a692-49f1-b3d3-d24ab95d6623/1770927593643_3.jpeg', NULL, new_cat_0, new_subcat_10, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_93;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Conjunto Logan Bicolor Azul Petróleo ', 80, 199, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8379dfd4-e9be-4442-8225-8124549f16d2/1770927690428_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8379dfd4-e9be-4442-8225-8124549f16d2/1770927691595_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8379dfd4-e9be-4442-8225-8124549f16d2/1770927692150_3.jpeg', NULL, new_cat_0, NULL, NULL, 'active', 0, 'Poliamida de compressão, transparência 0.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_94;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macacão Space', 80, 190, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/c68dd9bf-4ce1-481f-bd2d-a57c7b2ca4f9/1770927415333_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/c68dd9bf-4ce1-481f-bd2d-a57c7b2ca4f9/1770927415789_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_95;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Dryfit Capuz Azul Royal ', 20, 59.9, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bc9064fe-92a9-42d3-83ef-4cb52fff2cc4/1770927513989_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bc9064fe-92a9-42d3-83ef-4cb52fff2cc4/1770927514509_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bc9064fe-92a9-42d3-83ef-4cb52fff2cc4/1770927514953_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_96;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAMISETA MASC OVERSIZED PWRD', 49, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1715854433-1-jpg-84bfa1c49cb9d49a8117423888682349-640-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_97;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAMISETA MASC AERODRY AZUL MARINHO', 49, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1984323913-img_1098-jpg-14232583ed7d8654c217676992465794-640-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 3, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_98;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Running Cinza chumbo', 95, 180, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bb3a9f6d-baa1-46a7-88c7-d56a912954f7/1770686325042_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bb3a9f6d-baa1-46a7-88c7-d56a912954f7/1770686326511_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/bb3a9f6d-baa1-46a7-88c7-d56a912954f7/1770686327049_3.jpeg', NULL, new_cat_1, new_subcat_4, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_99;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Cravo Azul Ice Canelado / Castanho', 81.53, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/01/Top-Cravo-Azul-Ice-Canelado-Castanho-1.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/01/Top-Cravo-Azul-Ice-Canelado-Castanho-2.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, 'Top fitness canelado com alças largas, decote quadrado e bojo removível, oferecendo sustentação confortável, ajuste firme e design sofisticado para treinos e dia a dia. O Top Cravo foi pensado para unir sustentação, conforto e estética em uma única peça. Confeccionado em tecido canelado premium, entrega ajuste firme ao corpo, oferecendo segurança durante o treino e conforto para o uso ao longo do dia. O tecido encorpado proporciona sensação de firmeza e conforto ao vestir, enquanto o forro interno Ice Touch garante toque macio e melhor conforto térmico. O decote quadrado valoriza o colo com elegância, e as alças largas ajudam a distribuir melhor o peso, trazendo mais estabilidade e sustentação. A modelagem estratégica com recorte anatômico nas costas acompanha os movimentos com liberdade, enquanto o elástico interno de 3 cm garante firmeza sem apertar. A abertura interna para bojo removível permite adaptação conforme a preferência de uso. Os detalhes em castanho, combinados ao tom Azul Ice, criam um visual moderno e sofisticado, elevando o look fitness e athleisure. Ideal para academia, musculação, funcional, corrida ou para compor produções casuais com estilo. Um top que acompanha seu ritmo, respeita seu corpo e entrega funcionalidade com design premium.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_100;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED DANNY CINZA CHUMBO', 69, 135, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2002932878-11-png-4a3541a5642018094017694778958845-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2002932924-13-png-d44818cd5bc50ca34017694778998108-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2002932938-14-png-da3181b664e479e9ea17694779076471-480-0.webp', NULL, new_cat_0, new_subcat_0, NULL, 'active', 4, 'O cropped Danny na cor cinza chumbo é a escolha perfeita para quem busca conforto e estilo. Com um design moderno e um caimento incrível, ele é ideal para combinar com diversas peças do seu guarda-roupa.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_101;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED AMANDA TULE BRANCO', 69, 135, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f8dfb2c3-d531-422d-9260-4f011934efb0/1771616084354_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f8dfb2c3-d531-422d-9260-4f011934efb0/1771616092303_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f8dfb2c3-d531-422d-9260-4f011934efb0/1771616092817_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, 'O CROPPED AMANDA É A PEÇA IDEAL PARA QUEM BUSCA CONFORTO, ESTILO E VERSATILIDADE NOS TREINOS OU NO DIA A DIA, AGORA EM UMA VERSÃO AINDA MAIS LEVE E RESPIRÁVEL

CARACTERÍSTICAS PRINCIPAIS:

MODELAGEM CONFORTÁVEL E SOLTINHA: CAIMENTO RELAXADO QUE GARANTE CONFORTO E MOBILIDADE, IDEAL PARA ATIVIDADES DINÂMICAS OU PARA O USO NO DIA A DIA.

LEVEZA E RESPIRABILIDADE: CONFECCIONADO EM TULE COM TELA FURADINHA, PROPORCIONA VENTILAÇÃO CONSTANTE E TOQUE LEVE, PERFEITO PARA TREINOS E SOBREPOSIÇÕES.

TECIDO TULE: COMPOSIÇÃO DE 85% POLIAMIDA E 15% ELASTANO, GARANTINDO ELASTICIDADE, AJUSTE CONFORTÁVEL AO CORPO E MAIOR DURABILIDADE.

MODELO VESTE: P

O CROPPED AMANDA EM TULE É A ESCOLHA PERFEITA PARA QUEM BUSCA PRATICIDADE, CONFORTO E ESTILO EM UMA PEÇA ÚNICA, COM AINDA MAIS LEVEZA E FRESCOR.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_102;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging Lótus Cinza Canelado', 136.53, 249, 'https://www.bechose.com.br/wp-content/uploads/2026/02/7Q9A7130-bordado.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/7Q9A7135-bordado.webp', 'https://www.bechose.com.br/wp-content/uploads/2026/02/legging-lotus-cinza-canelado-rosa-balerine-2.webp', NULL, new_cat_0, new_subcat_5, NULL, 'active', 2, 'Protegido: Legging Lótus Cinza Canelado', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_103;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Tulipa Cinza Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/02/7Q9A7176-bordado.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/4888dad0-0ef1-4ed6-afe7-de0a0fcf1c06/1770761473224_1.jpeg', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, 'Protegido: Top Tulipa Cinza Canelado', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_104;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Lotus Cinza Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/02/7Q9A7176-bordado.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/4a41dbef-ddcf-44f9-876d-3b2f0f36c20d/1770761339105_1.jpeg', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, 'Protegido: Shorts Lotus Cinza Canelado', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_105;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Flor Rosa Ballerine', 104.44, 189.9, 'https://www.bechose.com.br/wp-content/uploads/2026/02/7Q9A7155.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d22469d0-0852-4833-a7a4-9dc446a030ed/1770761248329_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d22469d0-0852-4833-a7a4-9dc446a030ed/1770761249402_2.jpeg', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'Protegido: Shorts Flor Rosa Ballerine', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_106;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAMISETA MARROM OVERSIZED MORE ESPRESSO', 59, 99, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2012636714-frente_more-png-22d45f9933a5c7c43c17702958418998-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/2012636733-costa_more-png-312639953a365209bb17702958477396-480-0.webp', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 2, 'CONHEÇA A CAMISETA OVERSIZED, UMA PEÇA ESSENCIAL PARA QUEM BUSCA CONFORTO ABSOLUTO E UM ESTILO CASUAL COM UM TOQUE MODERNO.

CARACTERÍSTICAS PRINCIPAIS:

MODELAGEM OVERSIZED: PROPORCIONA UM CAIMENTO SOLTO E DESPOJADO, GARANTINDO CONFORTO E ESTILO EM QUALQUER LOOK.

CONFORTO NATURAL: CONFECCIONADA EM 100% ALGODÃO, OFERECE MACIEZ AO TOQUE E RESPIRABILIDADE, IDEAL PARA TODAS AS ESTAÇÕES.

DURABILIDADE: O ALGODÃO DE ALTA QUALIDADE ASSEGURA RESISTÊNCIA E LONGA VIDA ÚTIL À PEÇA, MESMO COM USO FREQUENTE.

MODELO VESTE: P

A CAMISETA OVERSIZED É A PEÇA INDISPENSÁVEL PARA QUEM BUSCA UNIR CONFORTO, FUNCIONALIDADE E ESTILO EM UMA SÓ ESCOLHA.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_107;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta More Espresso Verde', 59, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/9c3d78cb-2dec-4499-b46e-6b8cf01f71b7/1770594965988_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/9c3d78cb-2dec-4499-b46e-6b8cf01f71b7/1770594966991_2.jpeg', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_108;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED AMANDA MARROM MORE ESPRESSO', 55, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7a17d5b8-a6ec-4c69-995d-d44492262a8d/1771614350956_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7a17d5b8-a6ec-4c69-995d-d44492262a8d/1771614351456_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7a17d5b8-a6ec-4c69-995d-d44492262a8d/1771614351994_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, 'O **Cropped Amanda** é a peça IDEAL PARA QUEM BUSCA CONFORTO, ESTILO E VERSATILIDADE NOS TREINO OU NO DIA A DIA, COM UM CAIMENTO **um pouco mais solto** e **mangas curtas**, ele é confeccionado em **100% algodão**, garantindo leveza, maciez ao toque e uma ótima respirabilidade. Perfeito para quem quer unir praticidade e um visual moderno com um toque natural. **Características principais:** **Modelagem Confortável e Soltinha:** Com um caimento mais relaxado, oferece conforto e mobilidade, ideal para atividades dinÂMICAS OU PARA USAR NO DIA A DIA. **Conforto Natural:** Produzido em **100% algodão**, proporciona uma sensação suave ao toque, excelente respirabilidade e durabilidade, garantindo conforto em qualquer ocasião. **Mangas Curtas e Design Moderno:** As mangas curtas adicionam um toque descontraído e estiloso, perfeito para quem busca um visual esportivo e fashion. **Modelo veste:** O Cropped Amanda é a escolha perfeita para quem valoriza **conforto, praticidade e estilo** em uma PEÇA ÚNICA.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_109;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED AMANDA OFF WHITE LUCAS DA ROSA "RAZÃO DE SER"', 49, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8d133af8-b7b8-4330-b1ef-cf7a0946c389/1771614398580_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8d133af8-b7b8-4330-b1ef-cf7a0946c389/1771614399441_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/8d133af8-b7b8-4330-b1ef-cf7a0946c389/1771614399961_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, 'Camiseta feminina cropped, estilo casual, ideal para o verão. Tecido leve e confortável, disponível em diversas opções de tamanhos.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_110;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'LEGGING REMEMBER PRETA', 91, 190, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/img_9621-494f2457472826880417513665121752-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/img_9620-b006627bb2a0d455af17513665156977-480-0.webp', '-', NULL, new_cat_0, new_subcat_5, NULL, 'active', 1, 'A Legging Remember é a escolha perfeita para quem busca um visual clean e confortável sem abrir mão do estilo. Com cós alto e sem recortes, ela proporciona um ajuste firme e elegante, ideal para treinos intensos ou uso casual. **Características principais:** **Cós Alto:** Design que garante maior sustentação e modela a silhueta sem apertar, proporcionando segurança em cada movimento. **Sem Recortes:** Estrutura uniforme que oferece um visual minimalista, ideal para quem prefere um estilo mais clean. **Ajuste Confortável:** Desenvolvida para se adaptar ao corpo, garantindo flexibilidade e liberdade de movimento sem comprometer o conforto. **Tecido Nagoya:** Com uma composição de 88% poliamida e 12% elastano, esse tecido inovador se adapta perfeitamente ao corpo, proporcionando um ajuste dinâmico e liberdade de movimento. Sua estrutura combina toque macio, alta elasticidade e conforto térmico, garantindo bem-estar em qualquer atividade. Além disso, conta com proteção UV, oferecendo mais segurança para treinos ao ar livre. **Modelo veste:** P. A Legging Remember é a peça essencial para quem valoriza conforto, simplicidade e estilo em uma única peça, seja no treino ou no dia a dia.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_111;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS KELLY PENÉLOPE C/ETIQUETA', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1-dee34c117c1f06620117393603632973-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/3-78a4dd95997f4a37da17393603633793-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/4-cad6dbf46260d06e0e17393603631593-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'SHORTS KELLY PENÉLOPE', NULL, 0, '', '', '', '', '', '', '0', false) RETURNING id INTO new_prod_112;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Carol Navy Blue ', 76, 145, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/84bbc295-92d2-4c63-9037-6e6bac84e51e/1770595144068_1.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/84bbc295-92d2-4c63-9037-6e6bac84e51e/1770595144580_2.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_113;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Regata Julia Chumbo', 56.94, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/a770b418-876e-48f3-89e1-e6590a3b9c13/1771615551627_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/a770b418-876e-48f3-89e1-e6590a3b9c13/1771615552133_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/a770b418-876e-48f3-89e1-e6590a3b9c13/1771615552586_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_114;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Preta Aerodry PWRD preto', 59, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/69c352da-c044-40e6-b949-b4dc171df823/1770595533092_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/69c352da-c044-40e6-b949-b4dc171df823/1770595533608_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/69c352da-c044-40e6-b949-b4dc171df823/1770595534083_3.jpeg', NULL, new_cat_1, new_subcat_9, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_115;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED LARA OFF WHITE WONDER', 75, 130, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1907790621-8-png-777d4114f8161392fc17610507412533-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1907790752-6-png-ab5f06e880b38791b817610507459691-480-0.webp', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, 'Tecido Wonder: Com uma composição de 77% poliamida e 23% elastano, esse tecido possui compressão inteligente, toque macio e brilho acetinado. Sua elasticidade em quatro direções garante conforto térmico e maior durabilidade, com costuras reforçadas para resistência nos treinos.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_116;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Amanda Preto Lucas da Rosa ', 49, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f481bb83-4026-4464-b2a5-d3db68e63047/1771615425595_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f481bb83-4026-4464-b2a5-d3db68e63047/1771615426077_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f481bb83-4026-4464-b2a5-d3db68e63047/1771615426536_3.jpeg', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_117;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Aerodry Verde Jade', 59, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/53c8251d-fa73-4c8c-be91-a543dfb1f475/1770595931276_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/53c8251d-fa73-4c8c-be91-a543dfb1f475/1770595932454_2.jpeg', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 3, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_118;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'REGATA THIAGO AIRFLEX PRETO C/ PRATA', 59, 99, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1923481144-5-png-f8240311f32eba38f217624323885371-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1923481155-6-png-263ddd42ff9a86cee817624323930339-480-0.webp', '-', NULL, new_cat_1, new_subcat_0, NULL, 'active', 4, 'Esgotado

0%
OFF

Frete grátis', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_119;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Mileni off white estampa cinza', 59, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/5bc32e0b-a278-43ba-b47b-73899ab89350/1770595977636_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/5bc32e0b-a278-43ba-b47b-73899ab89350/1770595978561_2.jpeg', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_120;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED CARNA AMARELO SENSE', 69, 130, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1698529115-28-png-bbaaf686ba0ce742a317398874168947-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1698529194-3-png-914ddf012396f577d617398874202387-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1698529265-11-png-c7a53792a61027783a17398874295871-480-0.webp', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, 'CROPPED CARNA AMARELO SENSE', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_121;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'LEGGING REMEMBER CHOCOLATE', 91, 190, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1808240643-8-png-499219baf9131612ad17519404307910-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1808240645-9-png-310fa17aa2bd7e86be17519404348162-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1808240647-1-png-d2440368cf3d28a99817519404388576-480-0.webp', NULL, new_cat_0, new_subcat_5, NULL, 'active', 2, 'A LEGGING REMEMBER É A ESCOLHA PERFEITA PARA QUEM BUSCA UM VISUAL CLEAN E CONFORTÁVEL SEM ABRIR MÃO DO ESTILO. COM CÓS ALTO E SEM RECORTES, ELA PROPORCIONA UM AJUSTE FIRME E ELEGANTE, IDEAL PARA TREINOS INTENSOS OU USO CASUAL.

**CARACTERÍSTICAS PRINCIPAIS:**

**CÓS ALTO:** DESIGN QUE GARANTE MAIOR SUSTENTAÇÃO E MODELA A SILHUETA SEM APERTAR, PROPORCIONANDO SEGURANÇA EM CADA MOVIMENTO.

**SEM RECORTES:** ESTRUTURA UNIFORME QUE OFERECE UM VISUAL MINIMALISTA, IDEAL PARA QUEM PREFERE UM ESTILO MAIS CLEAN.

**AJUSTE CONFORTÁVEL:** DESENVOLVIDA PARA SE ADAPTAR AO CORPO, GARANTINDO FLEXIBILIDADE E LIBERDADE DE MOVIMENTO SEM COMPROMETER O CONFORTO.

**TECIDO NAGOYA:** COM UMA COMPOSIÇÃO DE 88% POLIAMIDA E 12% ELASTANO, ESSE TECIDO INOVADOR SE ADAPTA PERFEITAMENTE AO CORPO, PROPORCIONANDO UM AJUSTE DINÂMICO E LIBERDADE DE MOVIMENTO. SUA ESTRUTURA COMBINA TOQUE MACIO, ALTA ELASTICIDADE E CONFORTO TÉRMICO, GARANTINDO BEM-ESTAR EM QUALQUER ATIVIDADE. ALÉM DISSO, CONTA COM PROTEÇÃO UV, OFERECENDO MAIS SEGURANÇA PARA TREINOS AO AR LIVRE **.**

**MODELO VESTE:** M

A LEGGING REMEMBER É A PEÇA ESSENCIAL PARA QUEM VALORIZA CONFORTO, SIMPLICIDADE E ESTILO EM UMA ÚNICA PEÇA, SEJA NO TREINO OU NO DIA A DIA.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_122;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS EMPINA BUMBUM BRANCO', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1621164208-19-png-bdafa488b6dda2ebc717320168007442-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1621164518-23-png-41d33591124b0a860817320166974838-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1621164238-16-png-b87daf9b345ddb491117320168089367-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'O modelo mais amado que combina um design médio com um toque irresistível de estilo. Este shorts é a escolha perfeita para quem deseja realçar suas curvas com elegância e conforto, mantendo um visual moderno e atraente.

Características principais:

Efeito Empinadinho: Projetado com um corte estratégico que realça e modela o bumbum, oferecendo um efeito volumoso e natural que vai chamar a atenção.

Ajuste Confortável: Feito para se adaptar ao seu corpo, proporcionando um ajuste que se encaixa perfeitamente e destaca suas curvas sem sacrificar o conforto.

Tecido Nagoya: Desenvolvido com 88% poliamida e 12% elastano, esse tecido único oferece um equilíbrio ideal entre flexibilidade e resistência. Sua estrutura avançada proporciona ventilação eficiente, ajuste anatômico e conforto incomparável, acompanhando cada movimento com leveza e segurança.

Tamanho Médio: O design de tamanho médio é ideal para quem busca um ajuste que favorece a forma sem exagerar, oferecendo um visual natural e elegante.

Modelo veste: P

O Shorts Empina Bumbum é o item essencial que vai transformar seu look e garantir que você se sinta incrível em qualquer ocasião. Com seu design único e o ajuste perfeito, é fácil entender por que ele é o favorito de todos', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_123;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'LEGGING REMEMBER PRETA C/SILK', 91, 190, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930734366-25-png-a7f27fc1147d255b9017630019826496-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930734369-28-png-50a4bd2bd4da08c0d417630019861226-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930734405-27-png-88d5fc2b59088aa69717630019932690-480-0.webp', NULL, new_cat_0, new_subcat_5, NULL, 'active', 0, 'A legging style that combines both comfort and style, featuring a sleek black design with silk detailing. Perfect for a day out or workout.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_124;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'TOP ALICE AMARELO NEON', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930729748-13-png-3ea26cb781d3c8e93317630019596967-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930729757-12-png-c69ce3017acbd0aa3617630019677612-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'O Top Alice Wonder é a opção perfeita para quem procura um design elegante e funcional, oferecendo conforto e suporte durante os treinos mais exigentes. ele traz um detalhe exclusivo nas costas, com 3 tiras de cada lado, criando um visual moderno e diferenciado sem comprometer a performance.

Detalhes que fazem a diferença:

Apoio Confiável: As alças largas oferecem estabilidade e suporte, tornando o top ideal para atividades de alta intensidade, sem abrir mão do conforto e da segurança.

Proteção Extra: A frente do top é desenhada para proporcionar maior cobertura, permitindo que você se concentre no treino sem preocupações.

Sem Elástico no Cós: Diferente da versão anterior, o Top Alice Wonder não possui elástico no cós, garantindo maior conforto abdominal sem perder a firmeza necessária para os treinos.

Design Exclusivo nas Costas: Com 3 tiras de cada lado nas costas, o Top Alice Wonder garante uma ventilação superior e um toque de estilo que se destaca, mantendo a mobilidade e conforto durante os movimentos.

TECIDO WONDER: COM UMA COMPOSIÇÃO DE 77% POLIAMIDA E 23% ELASTANO, ESSE TECIDO POSSUI COMPRESSÃO INTELIGENTE, TOQUE MACIO E BRILHO ACETINADO. SUA ELASTICIDADE EM QUATRO DIREÇÕES GARANTE CONFORTO TÉRMICO E MAIOR DURABILIDADE, COM COSTURAS REFORÇADAS PARA RESISTÊNCIA NOS TREINOS.

Modelo veste: p/gg

O Top Alice Wonder é a escolha ideal para quem busca equilíbrio entre conforto, estilo e desempenho, agora com ainda mais liberdade na região abdominal, sem abrir mão do suporte e da sofisticação.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_125;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS BEL C/BOLSO AMARELO NEON', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930731166-16-png-0f12194a2c36e944ef17630019161656-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930731166-16-png-0f12194a2c36e944ef17630019161656-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930731177-18-png-d6e0489a36067ac56717630019240785-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 3, 'Shorts bel: O modelo ideal para quem busca desempenho e conforto em treinos intensos de CrossFit. Com um comprimento mais longo, esse shorts oferece cobertura extra, enquanto o bolso sem zíper no cós proporciona praticidade para carregar pequenos itens durante os treinos.

Características principais:

Design Longo e Funcional: Seu comprimento maior oferece maior cobertura e segurança durante os movimentos intensos, sem comprometer a liberdade de movimento essencial para o CrossFit.

Ajuste Confortável: Confeccionado para se adaptar ao corpo, garantindo um ajuste firme e flexível que acompanha os movimentos dinâmicos do treino, oferecendo suporte sem apertar.

TECID NAGOYA: DESENVOLVIDO COM 77% POLIAMIDA E 23% ELASTANO, ESSE TECIDO ÚNICO OFERECE UM EQUILÍBRIO IDEAL ENTRE FLEXIBILIDADE E RESISTÊNCIA. SUA ESTRUTURA AVANÇADA PROPORCIONA VENTILAÇÃO EFICIENTE, AJUSTE ANATÔMICO E CONFORTO INCOMPARÁVEL, ACOMPANHANDO CADA MOVIMENTO COM LEVEZA E SEGURANÇA.

Bolso Prático: O bolso sem zíper no cós é perfeito para armazenar pequenos itens, como chaves ou celulares com segurança e fácil acesso, sem atrapalhar seu desempenho.

Comprimento Ideal: O design de comprimento mais longo oferece cobertura extra, mantendo o conforto e a estabilidade durante os agachamentos, saltos e outros movimentos do CrossFit.

Modelo veste: P

O Shorts bel é a escolha perfeita para quem precisa de praticidade, conforto e resistência em cada treino.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_126;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Oversized Preta Lucas da Rosa', 59, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7c0ff2db-340c-4f77-bd80-8e42ac8ab949/1770596390171_1.jpeg', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_127;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CAMISETA MASC AERODRY AMARELO NEON', 59, 99, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930731579-4-png-4aba336375139c6f7317630025083313-480-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_128;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Regata Now Aerodry Rouge ', 45, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/017ff3bb-9a63-467f-8dbb-394a5c1f628a/1770596270475_1.jpg', '-', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 1, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_129;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS KELLY CAPPUCCINO', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1808244319-16-png-81942eca9663219e0917519408416342-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1808244319-16-png-81942eca9663219e0917519408416342-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1808244323-17-png-d774db12c1aa551f9517519408511446-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'O MODELO IDEAL PARA OS TREINOS INTENSOS QUE EXIGE DESEMPENHO E CONFORTO. COM UM DESIGN UM POUCO MAIS COMPRIDO QUE O CLÁSSICO SHORTS EMPINA BUMBUM, O SHORTS KELLY OFERECE O SUPORTE E A FUNCIONALIDADE NECESSÁRIOS PARA ACOMPANHAR TODOS OS MOVIMENTOS DINÂMICOS E EXIGENTES DAS SUAS SESSÕES DE TREINO.

CARACTERÍSTICAS PRINCIPAIS:

DESIGN IDEAL PARA SEU TREINO: SEU COMPRIMENTO LIGEIRAMENTE MAIOR E A AUSÊNCIA DE RECORTE TRASEIRO PROPORCIONAM UMA COBERTURA ADICIONAL E UM AJUSTE SEGURO, AJUDANDO A MANTER A FORMA DURANTE EXERCÍCIOS INTENSOS E MOVIMENTOS MULTIDIMENSIONAIS.

SEM RECORTE ATRÁS: O DESIGN LISO NA PARTE DE TRÁS GARANTE UM ACABAMENTO SUAVE E CONTÍNUO, EVITANDO QUALQUER DESCONFORTO OU DISTRAÇÃO DURANTE OS TREINOS E PROPORCIONANDO UM VISUAL POLIDO.

TECIDO NAGOYA: COM UMA COMPOSIÇÃO DE 88% POLIAMIDA E 12% ELASTANO, ESSE TECIDO INOVADOR SE ADAPTA PERFEITAMENTE AO CORPO, PROPORCIONANDO UM AJUSTE DINÂMICO E LIBERDADE DE MOVIMENTO. SUA ESTRUTURA COMBINA TOQUE MACIO, ALTA ELASTICIDADE E CONFORTO TÉRMICO, GARANTINDO BEM-ESTAR EM QUALQUER ATIVIDADE. ALÉM DISSO, CONTA COM PROTEÇÃO UV, OFERECENDO MAIS SEGURANÇA PARA TREINOS AO AR LIVRE.

AJUSTE CONFORTÁVEL: O DESIGN CUIDADOSAMENTE ELABORADO ASSEGURA UM AJUSTE QUE ACOMPANHA OS SEUS MOVIMENTOS COM FACILIDADE, SEM ABRIR MÃO DO ESTILO OU DO SUPORTE NECESSÁRIO PARA TREINOS INTENSOS.

MODELO VESTE: O SHORTS KELLY É A ESCOLHA PERFEITA PARA QUEM BUSCA UM VISUAL SOFISTICADO E FUNCIONALIDADE INCOMPARÁVEL. IDEAL PARA TREINOS E PARA QUEM DESEJA UM POUCO MAIS DE COMPRIMENTO E UM DESIGN MODERNO, É O FAVORITO QUE VAI ELEVAR A SUA EXPERIÊNCIA DE TREINO.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_130;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta marrom café ', 59, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/9b7f40e0-5db8-4d2c-824f-92c0a55c1a5a/1770588106740_1.jpeg', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_131;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Gota Cinza Prisma', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1960759274-32-png-26a4a39f37bf0d18fb17652141834790-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1960759519-33-png-e1f8ca7731cce0cfa817652141914303-480-0.webp', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 5, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_132;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'SHORTS THALI Cinza PRISMA', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1960756514-34-png-c2a5339fc45ce170c217652142132412-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1960756563-36-png-c773606e52cd3d1c4e17652142171986-480-0.webp', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 5, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_133;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'CROPPED CROSS PRETO', 54.09, 99, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/b399e494-1713-4459-a606-7ac477e36739/1771615481627_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/b399e494-1713-4459-a606-7ac477e36739/1771615482161_2.jpeg', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 2, 'O Cropped Cross é a união perfeita entre estilo moderno e conforto funcional. Com design diferenciado e modelagem ajustada, ele valoriza a silhueta enquanto garante liberdade de movimento, sendo ideal para treinos, atividades esportivas ou para compor looks casuais com um toque fashion.

DETALHES DO PRODUTO:
Design com detalhe cross para visual moderno
Modelagem confortável e ajustada ao corpo
Tamanhos disponíveis: P | M | G | GG
Peso médio aproximado
CUIDADOS COM A PEÇA:
Lavar à mão ou na máquina em processo suave, com temperatura máxima de 40°C
Não deixar de molho
Usar sabão neutro e enxaguar bem antes de secar
Secar à sombra, evitando exposição prolongada ao sol
Não utilizar alvejantes
Não realizar limpeza a seco
Evitar temperaturas elevadas (não ultrapassar 170°C em processos térmicos)
O Cropped Cross é a escolha ideal para quem busca um visual atual, confortável e versátil, perfeito para o dia a dia ou para os treinos.', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_134;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macacao Ana Leticia Rosé Wonder', 120, 240, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1883726768-21-png-3057d3684dd2f030cd17585972992509-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1883726772-2-png-591b42e18af9f75a2517593184413118-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1883726770-24-png-be26fc9786d561714417593184370222-480-0.webp', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-295721514">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_135;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Cropped Carol Castanho ', 69, 130, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/87bfc101-f25a-4a81-b382-0d7fe0f5d9f8/1770587174312_2.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/87bfc101-f25a-4a81-b382-0d7fe0f5d9f8/1770587173309_1.webp', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 2, '-', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_136;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macacão Duda Off White Wonder', 120, 240, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7e8f698a-9732-4f88-9907-ca29ef24fdaf/1771181253621_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7e8f698a-9732-4f88-9907-ca29ef24fdaf/1771181254919_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-295721672">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_137;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peônia Açaí', 136.95, 249, 'https://www.bechose.com.br/wp-content/uploads/2025/09/macaquinho-peonia-roxo-acai-bechose-1.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/09/macaquinho-peonia-roxo-acai-bechose-2.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/09/macaquinho-peonia-roxo-acai-bechose-3.jpg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, 'class="fkcart-product-description fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_138;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Dália Cranberry Canelado', 136.95, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f323e6b6-3af0-4283-b1af-5f033252c41c/1771615749627_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f323e6b6-3af0-4283-b1af-5f033252c41c/1771615750919_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/f323e6b6-3af0-4283-b1af-5f033252c41c/1771615751471_3.jpeg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_139;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peônia Rosa Pink Canelado', 136.95, 249, 'https://www.bechose.com.br/wp-content/uploads/2025/10/macaquinho-peonia-rosa-pink-canelado-bechose-1-300x450.webp', '-', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 8, 'fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></div>
        <div class="fkcart-view-link-wrap fkcart-panel fkcart-shimmer" style="width:70px;height:18px;margin: 16px;"></div>
        <div class="fkcart-product-form-button fkcart-panel">
            <div class="fkcart-shimmer" style="width:100%;height:44px;    margin-top: 10px;"></div>
        </div>
    </div>
</div>
        <!-- END: Quick View -->', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_140;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peonia Marrom Pantone Canelado', 136.95, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7daafbbc-556f-40b5-89f3-19623e3235f8/1770414800591_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7daafbbc-556f-40b5-89f3-19623e3235f8/1770414802154_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/7daafbbc-556f-40b5-89f3-19623e3235f8/1770414803240_3.jpeg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_141;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peônia Azul Marinho Canelado', 136.95, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d2dbec3a-2347-4b29-937d-5fd1fee17d8b/1770414916164_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d2dbec3a-2347-4b29-937d-5fd1fee17d8b/1770414917204_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, 'class="fkcart-product-description fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_142;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peonia Verde Croco Canelado', 136.95, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1b1bd61f-c293-4fd9-896d-127061cf4e13/1770415040737_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/1b1bd61f-c293-4fd9-896d-127061cf4e13/1770415041891_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_143;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peonia Azul Ice Canelado / Castanho', 136.95, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/acb82531-3514-47bf-ad7e-c01fdca912b6/1770415199062_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/acb82531-3514-47bf-ad7e-c01fdca912b6/1770415199629_2.jpeg', '-', NULL, new_cat_0, new_subcat_1, NULL, 'active', 1, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_144;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Macaquinho Peonia Amarelo Manteiga Canelado', 136.95, 249, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d79ff4dc-8f41-4083-a914-221432059d5f/1771615811403_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d79ff4dc-8f41-4083-a914-221432059d5f/1771615812329_2.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/d79ff4dc-8f41-4083-a914-221432059d5f/1771615812855_3.jpeg', NULL, new_cat_0, new_subcat_1, NULL, 'active', 0, 'fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></div>
        <div class="fkcart-view-link-wrap fkcart-panel fkcart-shimmer" style="width:70px;height:18px;margin: 16px;"></div>
        <div class="fkcart-product-form-button fkcart-panel">
            <div class="fkcart-shimmer" style="width:100%;height:44px;    margin-top: 10px;"></div>
        </div>
    </div>
</div>
        <!-- END: Quick View -->', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_145;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpétua Preto Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/07/Shorts-perpetua-preto-canelado-1.jpg', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 3, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_146;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpétua 2″ Preto Absoluto', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/01/shorts_perpetua_02_preto-01.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_147;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpétua 6″ Preto Absoluto', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/01/shorts_perpetua_06_PRETO-01.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_148;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Peônia Azul Marinho', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/02/BECHOSE-Shorts-Perpetua-Azul-Marinho-1.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/02/BECHOSE-Shorts-Perpetua-Azul-Marinho-Rosa-Sorvete-2-1-redimensionada.jpg', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_149;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpétua Azul Marinho Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/09/shorts-perpetua-azul-marinho-canelado-bechose-1.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_150;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpétua Azul Ice Canelado / Castanho', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/01/Shorts-Perpetua-AzuleIce-Canelado-Castanho-1-300x450.webp', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/044410d3-18c4-4b1d-9eaf-47b107d89065/1770761669320_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/044410d3-18c4-4b1d-9eaf-47b107d89065/1770761670077_2.jpeg', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_151;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpetua Pink Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/12/shorts-perpetua-pink-canelado-1.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></div>
        <div class="fkcart-view-link-wrap fkcart-panel fkcart-shimmer" style="width:70px;height:18px;margin: 16px;"></div>
        <div class="fkcart-product-form-button fkcart-panel">
            <div class="fkcart-shimmer" style="width:100%;height:44px;    margin-top: 10px;"></div>
        </div>
    </div>
</div>
        <!-- END: Quick View -->', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_152;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Perpétua Preto', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2024/11/BECHOSE-shorts-perpetua-preto-020101-1-683x1024.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_153;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Tulipa Preto Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_top_tulipa-01.jpg', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_154;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Peônia Preto Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/07/Top-peonia-preto-canelado-1.jpg', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, 'class="wd-accordion-title tab-title-description wd-role-btn wd-active" data-accordion-index="description" tabindex="0">
					
													
								Descrição							</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_155;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Dália Azul Ice Canelado / Castanho', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2026/01/azul_ice_top_dalia-01.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, 'DALIA', 'ICE', 'CANELADO', '', '', '', '0', false) RETURNING id INTO new_prod_156;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Tulipa Pink Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/10/top-tulipa-rosa-pink-canelado-bechose-1.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 1, 'fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></div>
        <div class="fkcart-view-link-wrap fkcart-panel fkcart-shimmer" style="width:70px;height:18px;margin: 16px;"></div>
        <div class="fkcart-product-form-button fkcart-panel">
            <div class="fkcart-shimmer" style="width:100%;height:44px;    margin-top: 10px;"></div>
        </div>
    </div>
</div>
        <!-- END: Quick View -->', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_157;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Cravo Pink Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/10/top-cravo-rosa-pink-canelado-bechose-1.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></div>
        <div class="fkcart-view-link-wrap fkcart-panel fkcart-shimmer" style="width:70px;height:18px;margin: 16px;"></div>
        <div class="fkcart-product-form-button fkcart-panel">
            <div class="fkcart-shimmer" style="width:100%;height:44px;    margin-top: 10px;"></div>
        </div>
    </div>
</div>
        <!-- END: Quick View -->', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_158;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Iris Preto Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_top_iris-01.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_top_iris-04.jpg', 'https://www.bechose.com.br/wp-content/uploads/2025/03/Preto_top_iris-03-150x225.jpg', NULL, new_cat_0, new_subcat_3, NULL, 'active', 2, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_159;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Hortênsia Azul Santorini', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/04/santorine_azul_top_hortencia-01-682x1024.jpg', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_160;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Peônia Azul Marinho Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/09/top-peonia-azul-marinho-canelado-bechose-1.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'class="description_tab active" id="tab-title-description" role="presentation">
							
																	
										Descrição									</', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_161;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Top Cravo Preto Canelado', 81.92, 149, 'https://www.bechose.com.br/wp-content/uploads/2025/10/top-cravo-preto-canelado-bechose-1.webp', '-', '-', NULL, new_cat_0, new_subcat_3, NULL, 'active', 0, 'fkcart-panel fkcart-p-10 fkcart-shimmer" style="height:80px;margin:0 16px"></div>
        <div class="fkcart-view-link-wrap fkcart-panel fkcart-shimmer" style="width:70px;height:18px;margin: 16px;"></div>
        <div class="fkcart-product-form-button fkcart-panel">
            <div class="fkcart-shimmer" style="width:100%;height:44px;    margin-top: 10px;"></div>
        </div>
    </div>
</div>
        <!-- END: Quick View -->', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_162;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging C/ Bolso Lateral Jade', 101, 195, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960740694-23-png-caf47e4b8ffb71d60d17652141718275-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_5, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-256030413">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_163;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging Empina Bumbum Preta C/silk', 91, 190, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1845972480-jcj4508-jpg-ea96d4825ae65d816017550902821777-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1845972531-jcj4513-jpg-12aedd8609f3ed2ad517550918974633-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1845972567-jcj451-jpg-03663f8783da9be6ea17550919030713-480-0.webp', NULL, new_cat_0, new_subcat_5, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-279308025">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_164;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Legging Mariah Oceanic Café', 91, 190, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1527304006-5-png-e87c464ca3a50982d017219191643658-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1527304061-8-png-9d925a991770dd6f1717219210064123-480-0.webp', '-', NULL, new_cat_0, new_subcat_5, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-250581005">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_165;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Masc Aerodry Cinza Chumbo', 59, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/5-92c120ef9d47bf008417652835712448-640-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 6, 'class="item-description text-center" data-store="product-item-info-301685574">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_166;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Masc Airflex Preto C/ Assinatura Prata', 59, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1923482476-3-png-2b3e5837b289b3785917624320112982-640-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 4, 'class="item-description text-center" data-store="product-item-info-263040081">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_167;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Masc Airflex Preto C/ Bandeira Prata', 59, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1923482013-7-png-d7695bfebc168eb01617624320272898-640-0.webp', '-', '-', NULL, new_cat_1, new_subcat_9, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-301685557">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_168;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Camiseta Fem Oversized Off White "coffee To Survive"', 59, 99, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1859405228-98-png-015527bcbf6714cbb017562996469437-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_0, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-295721713">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_169;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Preto C/ Xícara', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1930733096-22-png-69a5ad6683d4ccb77317630022949942-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1930733113-33-png-7e36107b845209e6ec17636028007325-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1930733111-34-png-96641700cc257f465717636027967213-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 3, 'class="item-description text-center" data-store="product-item-info-222472920">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_170;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Branco', 76, 145, 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/cef5122e-44f0-4a9a-af74-3da37f8da11a/1770337945234_1.jpeg', 'https://dghbxwpxgsuprlksiklv.supabase.co/storage/v1/object/public/product-images/98191e2a-0eb6-4c35-aa19-2f7e1a258a95/cef5122e-44f0-4a9a-af74-3da37f8da11a/1770337946605_2.jpeg', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-272842839">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_171;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Vermelho Asia', 76, 145, 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2002913518-27-png-62cba1a212f84e4f9d17701217268340-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2002913532-29-png-c896eb211c416412a817701217307289-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2002913561-28-png-b8abe94a5fa2b0798a17701217348248-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, 'class="item-description text-center" data-store="product-item-info-242939137">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_172;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Jade', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960711328-16-png-1d3e9ff7196a84915717652141222731-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960711367-17-png-b64d836769f70eb48017655344072629-480-0.webp', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-234526635">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_173;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Preto C/ Etiqueta', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1525410989-52-png-d985723074d4bac9de17218514358489-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1525410993-54-png-9bb0bb72b07cdc5b6017217521674309-480-0.webp', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-222474273">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_174;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Bel C/ Bolso Vermelho Asia', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2002914149-23-png-b0023c01509c2a617817694777594543-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2002914215-25-png-59e3883b397e51093017701217461865-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2002914221-24-png-a158a3f5f208c2132417701217504144-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-222700919">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_175;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Cós V Cinza Prisma', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960759274-32-png-26a4a39f37bf0d18fb17652141834790-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960759519-33-png-e6321907f2349681cb17655345081599-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960759456-31-png-411b9cfebb702254b117655345042051-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 3, 'class="item-description text-center" data-store="product-item-info-222473488">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_176;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Kelly Jade', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960726229-2-png-f158ae0913b8f7776317652141366875-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960726282-19-png-87ea50bb1712f4bc6817655344556778-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960726326-18-png-26225f3a0f69d78ff217655344596675-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-223211800">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_177;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Cós V Off White Wonder', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1883726660-33-png-fc847928c30cbe5c0117585973555503-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1883726666-34-png-fcc4761a9fe1db037517593185023170-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1883726386-31-png-52bd3dd072aedda24017593183694580-240-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, 'class="item-description text-center" data-store="product-item-info-295721579">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_178;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Bel C/ Bolso Jade', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960717573-29-png-8c2efe9b562637b7dc17652145703849-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960717834-28-png-3008fda47e16bb2e3817655344175782-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960717865-27-png-be4fa4b432d30d798317655344212128-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 2, 'class="item-description text-center" data-store="product-item-info-226629105">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_179;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Rosé Wonder', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1883726694-16-png-cbe5cd4d01f39a1dd517585971951878-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1883726700-14-png-8a7c5412757529e59e17593183526112-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1883726698-15-png-8d7fe2a3dd200916a417593183475723-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-295721612">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_180;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Bel C/ Bolso Marrocos', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1525383636-4-png-c82bc8327e9a96bd8d17218512839173-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-222472277">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_181;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Cós V Rosé Wonder', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1907786938-5-png-f95ada94091978610917610507825395-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1907787073-12-png-12507a77a12dc3864717610518049322-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1907786975-6-png-fef7bd11c9ea42ffd017610517983244-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-222472277">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_182;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Bel C/bolso Cinza Chumbo', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/2003217824-11-png-d542fb8067ba9d1e9b17694793912107-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2003217826-13-png-3e4672bb4200d6da9517701238876400-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/2003217828-12-png-0075a680c9190d039717701238916157-480-0.webp', NULL, new_cat_0, new_subcat_2, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-272842677">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_183;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Running New Aerodry Preto', 95, 180, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960689806-5-png-a33fb96a816643ac2717652833696648-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960689985-6-png-58966403b4d6b05dcc17655343015451-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960689965-7-png-189967a60ee6e5e92917655342974754-480-0.webp', NULL, new_cat_1, new_subcat_4, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-306979377">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_184;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Cappuccino', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1808244623-22-png-972befce3bc559588217519408251377-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1808244627-24-png-9b67aead05b861be3b17534720338034-480-0.webp', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-223211813">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_185;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Empina Bumbum Cinza Chumbo', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1960766357-39-png-6d3c54a8d75c253d5c17652141998353-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 5, 'class="item-description text-center" data-store="product-item-info-234526009">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_186;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Shorts Kelly Amrap Branco', 76, 145, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1669675473-29-png-4419e8fe81c7da125417369627238512-640-0.webp', '-', '-', NULL, new_cat_0, new_subcat_2, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-234527090">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_187;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Snatch Aerodry Amarelo Neon ', 95, 180, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1930732696-45-png-d1c092b260eea0756317630025282839-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1930732698-46-png-e15ad4a6e9ad74c74717630025324168-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1930732700-47-png-7ead6f9ebdd4879b2c17636022485541-480-0.webp', NULL, new_cat_1, new_subcat_4, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-283634238">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_188;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Lift Cinza', 95, 180, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1758538653-39-png-4952d511fa6e99492c17465496932283-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1758538668-41-png-c72b01ef6c189d8c2317465496974326-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1758539353-42-png-f2d8931ce7e6ed75a517478329322345-480-0.webp', NULL, new_cat_1, new_subcat_4, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-306979377">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_189;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Snatch Aerodry Verde Jade', 95, 180, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/10-92794a1c8e3f670fb317652837630336-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960692256-12-png-df32609f1bacb759c917655344387083-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1960692179-11-png-101cb83be24d2df27d17655344348591-480-0.webp', NULL, new_cat_1, new_subcat_4, NULL, 'active', 1, 'class="item-description text-center" data-store="product-item-info-277294818">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_190;
  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (dest_owner, 'Bermuda Snatch Aerodry Chocolate', 95, 180, 'http://acdn-us.mitiendanube.com/stores/004/843/252/products/1832517299-21-png-3ccc2e48c4054b7b1c17538789228779-640-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/252/products/1832517375-19-png-ad5c8a8fc9824f847717538789266116-480-0.webp', 'https://acdn-us.mitiendanube.com/stores/004/843/285/products/1832517428-22-png-b2e056b5af78cc0fd017538789158015-480-0.webp', NULL, new_cat_1, new_subcat_4, NULL, 'active', 0, 'class="item-description text-center" data-store="product-item-info-242940547">
                            
                                                        
            
                    </', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '0', false) RETURNING id INTO new_prod_191;

  -- STEP 4: Copiar Variantes (734 total)
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_15, dest_owner, 'PP', 'Expresso/Canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_15, dest_owner, 'P', 'Expresso/Canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_15, dest_owner, 'G', 'Expresso/Canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_15, dest_owner, 'GG', 'Expresso/Canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_15, dest_owner, 'XG', 'Expresso/Canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_17, dest_owner, 'PP', 'expresso/canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_17, dest_owner, 'G', 'expresso/canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_17, dest_owner, 'GG', 'expresso/canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_17, dest_owner, 'XG', 'expresso/canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_19, dest_owner, 'PP', '/', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_19, dest_owner, 'G', '/', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_19, dest_owner, 'GG', '/', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_19, dest_owner, 'XG', '/', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_21, dest_owner, 'PP', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_21, dest_owner, 'G', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_21, dest_owner, 'GG', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_21, dest_owner, 'XG', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_2, dest_owner, 'G', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_2, dest_owner, 'GG', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_2, dest_owner, 'XG', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_0, dest_owner, 'm', NULL, '', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_17, dest_owner, 'M', 'expresso/canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_19, dest_owner, 'M', '/', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_24, dest_owner, 'M', 'off white', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_24, dest_owner, 'G', 'off white', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_26, dest_owner, 'PP', 'Expresso', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_26, dest_owner, 'P', 'Expresso', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_26, dest_owner, 'M', 'Expresso', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_26, dest_owner, 'G', 'Expresso', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_26, dest_owner, 'GG', 'Expresso', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_26, dest_owner, 'XG', 'Expresso', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_27, dest_owner, 'P', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_27, dest_owner, 'G', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_28, dest_owner, 'PP', 'Rosa Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_28, dest_owner, 'P', 'Rosa Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_28, dest_owner, 'M', 'Rosa Pink Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_28, dest_owner, 'G', 'Rosa Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_28, dest_owner, 'GG', 'Rosa Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_28, dest_owner, 'XG', 'Rosa Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_17, dest_owner, 'P', 'expresso/canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_2, dest_owner, 'PP', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_2, dest_owner, 'P', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_15, dest_owner, 'M', 'Expresso/Canela', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_19, dest_owner, 'P', '/', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_27, dest_owner, 'M', '-', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_2, dest_owner, 'M', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_21, dest_owner, 'M', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_21, dest_owner, 'P', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_40, dest_owner, 'G', 'ESMERALDA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_29, dest_owner, 'G', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_31, dest_owner, 'P', 'Branca', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_31, dest_owner, 'G', 'Branca', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_30, dest_owner, 'M', 'LAVANDA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_32, dest_owner, 'P', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_32, dest_owner, 'G', 'ESMERALDA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_34, dest_owner, 'P', 'ESMERALDA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_35, dest_owner, 'P', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_35, dest_owner, 'P', 'ESMERALDA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_35, dest_owner, 'M', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_35, dest_owner, 'G', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_36, dest_owner, 'P', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_37, dest_owner, 'P', 'ESMERALDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_37, dest_owner, 'M', 'ESMERALDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_37, dest_owner, 'G', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_38, dest_owner, 'G', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_40, dest_owner, 'M', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_39, dest_owner, 'P', 'PRETO', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_39, dest_owner, 'M', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_39, dest_owner, 'G', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_41, dest_owner, 'P', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_41, dest_owner, 'M', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_41, dest_owner, 'G', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_42, dest_owner, 'P', 'ROSA SATIN', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_43, dest_owner, 'P', 'ROSA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_43, dest_owner, 'G', 'ROSA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_43, dest_owner, 'M', 'ROSA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_44, dest_owner, 'P', 'ROSA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_44, dest_owner, 'M', 'ROSA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_44, dest_owner, 'G', 'ROSA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_45, dest_owner, 'P', 'ROSA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_45, dest_owner, 'M', 'ROSA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_45, dest_owner, 'G', 'ROSA', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_46, dest_owner, 'P', 'ROSA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_47, dest_owner, 'P', 'ROSA PINK', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_47, dest_owner, 'M', 'ROSA PINK', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_38, dest_owner, 'M', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_33, dest_owner, 'M', 'LAVANDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_32, dest_owner, 'M', 'ESMERALDA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_31, dest_owner, 'M', 'Branca', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_34, dest_owner, 'G', 'ESMERALDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_36, dest_owner, 'G', 'ESMERALDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_36, dest_owner, 'M', 'ESMERALDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_34, dest_owner, 'M', 'ESMERALDA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_29, dest_owner, 'M', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_47, dest_owner, 'G', 'ROSA PINK', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_49, dest_owner, 'P', 'Bege ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_49, dest_owner, 'M', 'Bege ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_49, dest_owner, 'G', 'Bege ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_50, dest_owner, 'PP', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_50, dest_owner, 'P', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_50, dest_owner, 'M', 'preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_50, dest_owner, 'G', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_51, dest_owner, 'P', ' Marrom Café', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_51, dest_owner, 'M', ' Marrom Café', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_51, dest_owner, 'G', ' Marrom Café', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_52, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_52, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_52, dest_owner, 'G', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_53, dest_owner, 'P', 'Areia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_53, dest_owner, 'M', 'Areia', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_53, dest_owner, 'G', 'Areia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_54, dest_owner, 'P', 'Cinza chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_54, dest_owner, 'M', 'Cinza chumbo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_54, dest_owner, 'G', 'Cinza chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_56, dest_owner, 'P', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_56, dest_owner, 'M', 'Rosa Pink', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_56, dest_owner, 'G', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_57, dest_owner, 'PP', 'preto glow ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_57, dest_owner, 'P', 'preto glow ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_57, dest_owner, 'M', 'preto glow ', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_58, dest_owner, 'PP', 'papaya', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_58, dest_owner, 'P', 'papaya', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_58, dest_owner, 'M', 'papaya', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_58, dest_owner, 'G', 'papaya', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_58, dest_owner, 'GG', 'papaya', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_58, dest_owner, 'XG', 'papaya', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_59, dest_owner, 'PP', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_59, dest_owner, 'P', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_59, dest_owner, 'M', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_59, dest_owner, 'G', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_59, dest_owner, 'GG', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_59, dest_owner, 'XG', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'PP', 'fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'P', 'fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'M', 'fúcsia', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'G', 'fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'GG', 'fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'XG', 'fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'M', ' Fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'G', ' Fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'PP', ' Fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'GG', ' Fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'XG', ' Fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_60, dest_owner, 'P', ' Fúcsia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_61, dest_owner, 'P', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_61, dest_owner, 'G', 'preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_62, dest_owner, 'G', 'blackout Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_62, dest_owner, 'M', 'blackout Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_61, dest_owner, 'M', 'preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_62, dest_owner, 'P', 'blackout Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_63, dest_owner, 'P', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_63, dest_owner, 'G', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_63, dest_owner, 'M', 'preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_64, dest_owner, 'P', 'preta', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_64, dest_owner, 'M', 'preta', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_64, dest_owner, 'G', 'preta', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_67, dest_owner, 'M', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_67, dest_owner, 'P', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_65, dest_owner, 'G', 'Off', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_65, dest_owner, 'P', 'Off', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_66, dest_owner, 'G', ' Rosa Lindo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_66, dest_owner, 'P', ' Rosa Lindo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_68, dest_owner, 'P', 'Rosa Lindo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_68, dest_owner, 'G', 'Rosa Lindo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_69, dest_owner, 'P', 'Rosa Lindo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_69, dest_owner, 'M', 'Rosa Lindo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_69, dest_owner, 'G', 'Rosa Lindo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_70, dest_owner, 'M', '-', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_70, dest_owner, 'G', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_70, dest_owner, 'P', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_71, dest_owner, 'XG', 'Verde água', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_71, dest_owner, 'M', 'Verde água', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_71, dest_owner, 'P', 'Verde água', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_71, dest_owner, 'PP', 'Verde água', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_71, dest_owner, 'G', 'Verde água', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_71, dest_owner, 'GG', 'Verde água', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_72, dest_owner, 'G', 'Verde Militar', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_72, dest_owner, 'P', 'Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_72, dest_owner, 'GG', 'Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_72, dest_owner, 'XG', 'Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_72, dest_owner, 'PP', 'Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_72, dest_owner, 'M', 'Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_73, dest_owner, 'PP', 'cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_73, dest_owner, 'XG', 'cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_73, dest_owner, 'GG', 'cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_73, dest_owner, 'G', 'cinza', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_73, dest_owner, 'M', 'cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_73, dest_owner, 'P', 'cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_74, dest_owner, 'P', ' Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_65, dest_owner, 'M', 'Off', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_66, dest_owner, 'M', ' Rosa Lindo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_68, dest_owner, 'M', 'Rosa Lindo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_74, dest_owner, 'M', ' Verde Militar', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_74, dest_owner, 'G', ' Verde Militar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_75, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_75, dest_owner, 'GG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_75, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_75, dest_owner, 'PP', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_75, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_76, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_76, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_77, dest_owner, 'P', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_77, dest_owner, 'M', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_77, dest_owner, 'G', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_78, dest_owner, 'M', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_78, dest_owner, 'G', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_79, dest_owner, 'G', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_80, dest_owner, 'M', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_80, dest_owner, 'P', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_80, dest_owner, 'G', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_1, dest_owner, 'M', 'PINK', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_81, dest_owner, 'M', 'Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_81, dest_owner, 'G', 'Branco', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_83, dest_owner, 'G', 'Energia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_83, dest_owner, 'M', 'Energia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_8, dest_owner, 'Único', '-', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_82, dest_owner, 'Único', 'Preta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_86, dest_owner, 'Único', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_84, dest_owner, 'Único', 'Chumbo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_85, dest_owner, 'Único', 'preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_87, dest_owner, 'Único', 'Tradicional ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_88, dest_owner, 'Único', 'Avelã ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_89, dest_owner, 'Único', 's/ Açúcar ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_10, dest_owner, 'Único', 's/ açúcar', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_90, dest_owner, 'P', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_90, dest_owner, 'G', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_90, dest_owner, 'M', 'Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_91, dest_owner, 'PP', 'Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_91, dest_owner, 'P', 'Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_91, dest_owner, 'GG', 'Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_91, dest_owner, 'XG', 'Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_91, dest_owner, 'M', 'Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_76, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_11, dest_owner, 'Único', 'Muscle Coffee', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_91, dest_owner, 'G', 'Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_92, dest_owner, 'XG', 'Grafite ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_92, dest_owner, 'P', 'Grafite ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_92, dest_owner, 'G', 'Grafite ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_92, dest_owner, 'GG', 'Grafite ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_92, dest_owner, 'PP', 'Grafite ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_92, dest_owner, 'M', 'Grafite ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_94, dest_owner, 'XG', 'Azul Petróleo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_94, dest_owner, 'M', 'Azul Petróleo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_94, dest_owner, 'G', 'Azul Petróleo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_94, dest_owner, 'GG', 'Azul Petróleo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_94, dest_owner, 'PP', 'Azul Petróleo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_94, dest_owner, 'P', 'Azul Petróleo ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_93, dest_owner, 'P', 'Magenta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_93, dest_owner, 'G', 'Magenta ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_93, dest_owner, 'M', 'Magenta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_96, dest_owner, 'G', 'Azul Royal', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_96, dest_owner, 'M', 'Azul Royal', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_96, dest_owner, 'P', 'Azul Royal', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_95, dest_owner, 'P', 'Púrpura', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_95, dest_owner, 'M', 'Púrpura', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_95, dest_owner, 'G', 'Púrpura', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_98, dest_owner, 'M', 'AZUL MARINHO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_98, dest_owner, 'G', 'AZUL MARINHO', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_98, dest_owner, 'P', 'AZUL MARINHO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_97, dest_owner, 'P', 'PRETA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_97, dest_owner, 'M', 'PRETA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_97, dest_owner, 'G', 'PRETA', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'G', 'Azul Ice com detalhes em Castanho', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'M', 'Azul Ice com detalhes em Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'PP', 'Azul Ice com detalhes em Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'P', 'Azul Ice com detalhes em Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'P', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'M', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_100, dest_owner, 'G', 'Azul Ice Canelado / Castanho', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_99, dest_owner, 'G', 'Cinza chumbo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_99, dest_owner, 'P', 'Cinza chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_99, dest_owner, 'GG', 'Cinza chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_101, dest_owner, 'M', 'Cinza Chumbo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_99, dest_owner, 'M', 'Cinza chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_101, dest_owner, 'G', 'Cinza Chumbo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_102, dest_owner, 'M', 'Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_102, dest_owner, 'G', 'Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_102, dest_owner, 'P', 'Branco', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_103, dest_owner, 'PP', ' Cinza Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_103, dest_owner, 'XG', ' Cinza Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_103, dest_owner, 'GG', ' Cinza Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_103, dest_owner, 'G', ' Cinza Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_103, dest_owner, 'P', ' Cinza Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_103, dest_owner, 'M', ' Cinza Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_105, dest_owner, 'M', 'Cinza Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_105, dest_owner, 'G', 'Cinza Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_105, dest_owner, 'P', 'Cinza Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_106, dest_owner, 'M', 'Rosa Ballerine', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_106, dest_owner, 'G', 'Rosa Ballerine', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_106, dest_owner, 'P', 'Rosa Ballerine', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_104, dest_owner, 'M', 'Cinza Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_104, dest_owner, 'G', 'Cinza Canelado', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_104, dest_owner, 'P', 'Cinza Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_107, dest_owner, 'XG', 'marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_107, dest_owner, 'G', 'marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_107, dest_owner, 'GG', 'marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_107, dest_owner, 'PP', 'marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_107, dest_owner, 'M', 'marrom', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_107, dest_owner, 'P', 'marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_108, dest_owner, 'M', 'Verde', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_108, dest_owner, 'G', 'Verde', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_108, dest_owner, 'P', 'Verde', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_109, dest_owner, 'GG', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_109, dest_owner, 'PP', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_109, dest_owner, 'XG', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_109, dest_owner, 'M', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_109, dest_owner, 'P', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_109, dest_owner, 'G', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_110, dest_owner, 'GG', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_110, dest_owner, 'XG', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_110, dest_owner, 'PP', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_110, dest_owner, 'P', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_110, dest_owner, 'G', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_110, dest_owner, 'M', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_111, dest_owner, 'G', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_111, dest_owner, 'PP', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_111, dest_owner, 'GG', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_111, dest_owner, 'XG', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_111, dest_owner, 'P', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_111, dest_owner, 'M', 'Preta', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_112, dest_owner, 'G', 'Rosa PENÉLOPE ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_113, dest_owner, 'P', 'Navy Blue', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_113, dest_owner, 'M', 'Navy Blue', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_113, dest_owner, 'G', 'Navy Blue', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_115, dest_owner, 'M', 'PWRD preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_115, dest_owner, 'G', 'PWRD preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_115, dest_owner, 'GG', 'PWRD preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_115, dest_owner, 'XG', 'PWRD preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_115, dest_owner, 'PP', 'PWRD preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_115, dest_owner, 'P', 'PWRD preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_114, dest_owner, 'P', 'Julia Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_114, dest_owner, 'M', 'Julia Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_114, dest_owner, 'GG', 'Julia Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_114, dest_owner, 'XG', 'Julia Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_114, dest_owner, 'PP', 'Julia Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_114, dest_owner, 'G', 'Julia Chumbo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_116, dest_owner, 'PP', 'OFF WHITE WONDER', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_116, dest_owner, 'M', 'OFF WHITE WONDER', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_116, dest_owner, 'G', 'OFF WHITE WONDER', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_116, dest_owner, 'GG', 'OFF WHITE WONDER', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_116, dest_owner, 'XG', 'OFF WHITE WONDER', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_116, dest_owner, 'P', 'OFF WHITE WONDER', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_117, dest_owner, 'XG', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_117, dest_owner, 'PP', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_117, dest_owner, 'M', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_117, dest_owner, 'G', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_117, dest_owner, 'P', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_117, dest_owner, 'GG', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_119, dest_owner, 'M', 'preto com prata', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_119, dest_owner, 'G', 'preto com prata', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_119, dest_owner, 'P', 'preto com prata', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_118, dest_owner, 'M', 'Verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_118, dest_owner, 'G', 'Verde Jade', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_118, dest_owner, 'P', 'Verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_120, dest_owner, 'PP', 'off white ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_120, dest_owner, 'P', 'off white ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_120, dest_owner, 'M', 'off white ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_120, dest_owner, 'G', 'off white ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_120, dest_owner, 'GG', 'off white ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_120, dest_owner, 'XG', 'off white ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_121, dest_owner, 'M', 'AMARELO SENSE', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_121, dest_owner, 'G', 'AMARELO SENSE', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_121, dest_owner, 'P', 'AMARELO SENSE', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_123, dest_owner, 'G', 'Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_123, dest_owner, 'M', 'Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_123, dest_owner, 'P', 'Branco', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_122, dest_owner, 'G', 'CHOCOLATE', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_122, dest_owner, 'M', 'CHOCOLATE', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_122, dest_owner, 'P', 'CHOCOLATE', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_124, dest_owner, 'PP', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_124, dest_owner, 'M', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_124, dest_owner, 'G', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_124, dest_owner, 'GG', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_124, dest_owner, 'XG', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_124, dest_owner, 'P', 'Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_125, dest_owner, 'G', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_125, dest_owner, 'M', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_125, dest_owner, 'P', 'Amarelo Neon', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_126, dest_owner, 'P', 'Amarelo Neon', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_126, dest_owner, 'M', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_126, dest_owner, 'G', 'Amarelo Neon', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_130, dest_owner, 'P', 'CAPPUCCINO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_130, dest_owner, 'M', 'CAPPUCCINO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_128, dest_owner, 'M', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_128, dest_owner, 'G', 'Amarelo Neon', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_128, dest_owner, 'PP', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_128, dest_owner, 'GG', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_128, dest_owner, 'P', 'Amarelo Neon', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_129, dest_owner, 'G', 'Rouge ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_129, dest_owner, 'P', 'Rouge ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_129, dest_owner, 'M', 'Rouge ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_127, dest_owner, 'PP', 'Preta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_127, dest_owner, 'P', 'Preta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_127, dest_owner, 'G', 'Preta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_127, dest_owner, 'GG', 'Preta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_127, dest_owner, 'XG', 'Preta ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_127, dest_owner, 'M', 'Preta ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_131, dest_owner, 'M', 'café ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_131, dest_owner, 'P', 'café ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_131, dest_owner, 'GG', 'café ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_131, dest_owner, 'G', 'café ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_132, dest_owner, 'M', 'Cinza Prisma', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_132, dest_owner, 'P', 'Cinza Prisma', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_132, dest_owner, 'G', 'Cinza Prisma', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_133, dest_owner, 'P', 'Cinza PRISMA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_133, dest_owner, 'G', 'Cinza PRISMA', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_133, dest_owner, 'M', 'Cinza PRISMA', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_134, dest_owner, 'G', 'PRETO', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_134, dest_owner, 'M', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_134, dest_owner, 'P', 'PRETO', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_136, dest_owner, 'G', 'castanho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_136, dest_owner, 'M', 'castanho ', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_135, dest_owner, 'G', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_135, dest_owner, 'XG', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_135, dest_owner, 'PP', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_135, dest_owner, 'GG', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_135, dest_owner, 'M', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_135, dest_owner, 'P', 'Rosé ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_137, dest_owner, 'G', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_137, dest_owner, 'XG', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_137, dest_owner, 'PP', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_137, dest_owner, 'M', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_137, dest_owner, 'GG', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_137, dest_owner, 'P', 'Off White ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_138, dest_owner, 'M', 'Açaí', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_138, dest_owner, 'G', 'Açaí', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_138, dest_owner, 'GG', 'Açaí', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_138, dest_owner, 'XG', 'Açaí', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_138, dest_owner, 'PP', 'Açaí', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_138, dest_owner, 'P', 'Açaí', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_139, dest_owner, 'XG', 'Cranberry Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_139, dest_owner, 'M', 'Cranberry Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_139, dest_owner, 'PP', 'Cranberry Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_139, dest_owner, 'P', 'Cranberry Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_139, dest_owner, 'G', 'Cranberry Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_139, dest_owner, 'GG', 'Cranberry Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_140, dest_owner, 'M', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_140, dest_owner, 'P', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_140, dest_owner, 'G', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_140, dest_owner, 'P', 'Rosa Pink', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_140, dest_owner, 'M', 'Rosa Pink', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_140, dest_owner, 'G', 'Rosa Pink', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'P', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'XG', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'M', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'PP', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'GG', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'P', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'M', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'G', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'GG', 'Marrom', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_141, dest_owner, 'G', 'Marrom', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_142, dest_owner, 'XG', 'Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_142, dest_owner, 'GG', 'Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_142, dest_owner, 'P', 'Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_142, dest_owner, 'M', 'Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_142, dest_owner, 'PP', 'Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_142, dest_owner, 'G', 'Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_143, dest_owner, 'PP', 'Verde Croco ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_143, dest_owner, 'P', 'Verde Croco ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_143, dest_owner, 'XG', 'Verde Croco ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_143, dest_owner, 'GG', 'Verde Croco ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_143, dest_owner, 'M', 'Verde Croco ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_143, dest_owner, 'G', 'Verde Croco ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_144, dest_owner, 'PP', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_144, dest_owner, 'GG', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_144, dest_owner, 'XG', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_144, dest_owner, 'P', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_144, dest_owner, 'M', 'Azul Ice Canelado / Castanho', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_144, dest_owner, 'G', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_145, dest_owner, 'GG', 'Amarelo Manteiga ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_145, dest_owner, 'XG', 'Amarelo Manteiga ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_145, dest_owner, 'G', 'Amarelo Manteiga ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_145, dest_owner, 'PP', 'Amarelo Manteiga ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_145, dest_owner, 'P', 'Amarelo Manteiga ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_145, dest_owner, 'M', 'Amarelo Manteiga ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_146, dest_owner, 'M', ' Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_146, dest_owner, 'G', ' Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_146, dest_owner, 'P', ' Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'PP', ' Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'P', ' Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'M', ' Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'G', ' Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'GG', ' Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'XG', ' Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'PP', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'P', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'M', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'G', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'GG', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_147, dest_owner, 'XG', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_148, dest_owner, 'PP', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_148, dest_owner, 'P', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_148, dest_owner, 'M', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_148, dest_owner, 'G', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_148, dest_owner, 'GG', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_148, dest_owner, 'XG', 'Preto Absoluto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_149, dest_owner, 'PP', ' Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_149, dest_owner, 'P', ' Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_149, dest_owner, 'M', ' Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_149, dest_owner, 'G', ' Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_149, dest_owner, 'GG', ' Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_149, dest_owner, 'XG', ' Azul Marinho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_150, dest_owner, 'M', 'Azul Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_150, dest_owner, 'G', 'Azul Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_150, dest_owner, 'XG', 'Azul Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_150, dest_owner, 'GG', 'Azul Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_150, dest_owner, 'PP', 'Azul Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_150, dest_owner, 'P', 'Azul Marinho ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_151, dest_owner, 'P', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_151, dest_owner, 'M', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_151, dest_owner, 'G', 'Azul Ice Canelado / Castanho', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_153, dest_owner, 'PP', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_153, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_153, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_153, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_153, dest_owner, 'GG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_153, dest_owner, 'XG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_152, dest_owner, 'GG', 'Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_152, dest_owner, 'PP', 'Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_152, dest_owner, 'XG', 'Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_152, dest_owner, 'P', 'Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_152, dest_owner, 'G', 'Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_152, dest_owner, 'M', 'Pink Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_154, dest_owner, 'PP', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_154, dest_owner, 'M', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_154, dest_owner, 'G', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_154, dest_owner, 'GG', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_154, dest_owner, 'XG', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_154, dest_owner, 'P', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'G', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'M', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'PP', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'GG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_155, dest_owner, 'XG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_156, dest_owner, 'M', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_156, dest_owner, 'P', 'Azul Ice Canelado / Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_157, dest_owner, 'P', 'Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_157, dest_owner, 'G', 'Pink', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_157, dest_owner, 'M', 'Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_158, dest_owner, 'P', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_158, dest_owner, 'PP', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_158, dest_owner, 'M', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_158, dest_owner, 'G', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_158, dest_owner, 'GG', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_158, dest_owner, 'XG', 'Rosa Pink', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_159, dest_owner, 'PP', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_159, dest_owner, 'G', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_159, dest_owner, 'GG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_159, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_159, dest_owner, 'M', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_159, dest_owner, 'XG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_160, dest_owner, 'G', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_160, dest_owner, 'PP', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_160, dest_owner, 'P', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_160, dest_owner, 'M', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_160, dest_owner, 'GG', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_160, dest_owner, 'XG', 'Azul Santorini', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_161, dest_owner, 'GG', 'Azul Marinho Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_161, dest_owner, 'XG', 'Azul Marinho Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_161, dest_owner, 'PP', 'Azul Marinho Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_161, dest_owner, 'P', 'Azul Marinho Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_161, dest_owner, 'M', 'Azul Marinho Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_161, dest_owner, 'G', 'Azul Marinho Canelado', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_162, dest_owner, 'GG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_162, dest_owner, 'XG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_162, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_162, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_162, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_162, dest_owner, 'PP', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_163, dest_owner, 'M', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_163, dest_owner, 'G', 'verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_163, dest_owner, 'P', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_164, dest_owner, 'M', ' Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_164, dest_owner, 'G', ' Preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_164, dest_owner, 'P', ' Preta', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_165, dest_owner, 'P', 'Oceanic Café', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_169, dest_owner, 'M', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_169, dest_owner, 'PP', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_169, dest_owner, 'P', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_169, dest_owner, 'GG', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_169, dest_owner, 'XG', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_169, dest_owner, 'G', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_166, dest_owner, 'G', ' Cinza Chumbo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_166, dest_owner, 'P', ' Cinza Chumbo', '-', 3);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_166, dest_owner, 'M', ' Cinza Chumbo', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_167, dest_owner, 'G', 'Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_167, dest_owner, 'M', 'Preto ', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_167, dest_owner, 'P', 'Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_168, dest_owner, 'P', 'Airflex Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_168, dest_owner, 'G', 'Airflex Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_168, dest_owner, 'GG', 'Airflex Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_168, dest_owner, 'M', 'Airflex Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_171, dest_owner, 'G', 'branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_171, dest_owner, 'M', 'branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_171, dest_owner, 'GG', 'branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_171, dest_owner, 'XG', 'branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_171, dest_owner, 'PP', 'branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_171, dest_owner, 'P', 'branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_170, dest_owner, 'P', 'Preto ', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_170, dest_owner, 'G', 'Preto ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_170, dest_owner, 'M', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_172, dest_owner, 'P', 'Vermelho Asia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_172, dest_owner, 'G', 'Vermelho Asia', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_172, dest_owner, 'M', 'Vermelho Asia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_174, dest_owner, 'G', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_174, dest_owner, 'GG', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_174, dest_owner, 'XG', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_174, dest_owner, 'PP', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_174, dest_owner, 'P', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_174, dest_owner, 'M', 'Preto ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_173, dest_owner, 'M', 'verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_173, dest_owner, 'G', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_173, dest_owner, 'P', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_175, dest_owner, 'G', 'Vermelho Asia', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_175, dest_owner, 'P', 'Vermelho Asia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_175, dest_owner, 'M', 'Vermelho Asia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_176, dest_owner, 'G', 'Cinza Prisma', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_176, dest_owner, 'P', 'Cinza Prisma', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_176, dest_owner, 'M', 'Cinza Prisma', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_177, dest_owner, 'M', 'verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_177, dest_owner, 'P', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_177, dest_owner, 'G', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_179, dest_owner, 'G', 'verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_179, dest_owner, 'M', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_179, dest_owner, 'P', 'verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_181, dest_owner, 'P', ' Marrocos', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_181, dest_owner, 'M', ' Marrocos', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_181, dest_owner, 'G', ' Marrocos', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_178, dest_owner, 'M', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_178, dest_owner, 'G', 'Off White ', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_180, dest_owner, 'P', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_180, dest_owner, 'G', 'Rosé ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_180, dest_owner, 'M', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_183, dest_owner, 'P', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_183, dest_owner, 'XG', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_183, dest_owner, 'G', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_183, dest_owner, 'GG', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_183, dest_owner, 'PP', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_183, dest_owner, 'M', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_182, dest_owner, 'M', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_182, dest_owner, 'G', 'Rosé ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_182, dest_owner, 'P', 'Rosé ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_185, dest_owner, 'M', 'Cappuccino', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_185, dest_owner, 'G', 'Cappuccino', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_186, dest_owner, 'P', ' Cinza Chumbo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_186, dest_owner, 'G', ' Cinza Chumbo', '-', 4);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_186, dest_owner, 'M', ' Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_187, dest_owner, 'M', ' Amrap Branco', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_187, dest_owner, 'P', ' Amrap Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_187, dest_owner, 'G', ' Amrap Branco', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_184, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_184, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_184, dest_owner, 'M', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_188, dest_owner, 'P', 'Amarelo Neon ', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_189, dest_owner, 'P', 'Cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_189, dest_owner, 'PP', 'Cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_189, dest_owner, 'G', 'Cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_189, dest_owner, 'GG', 'Cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_189, dest_owner, 'XG', 'Cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_189, dest_owner, 'M', 'Cinza', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_190, dest_owner, 'GG', 'Verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_190, dest_owner, 'M', 'Verde Jade', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_190, dest_owner, 'P', 'Verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_190, dest_owner, 'G', 'Verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_191, dest_owner, 'PP', 'Chocolate', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_191, dest_owner, 'P', 'Chocolate', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_191, dest_owner, 'M', 'Chocolate', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_191, dest_owner, 'G', 'Chocolate', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_191, dest_owner, 'GG', 'Chocolate', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_191, dest_owner, 'XG', 'Chocolate', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_12, dest_owner, 'G', 'preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_12, dest_owner, 'PP', 'preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_12, dest_owner, 'XG', 'preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_12, dest_owner, 'M', 'preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_12, dest_owner, 'P', 'preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_12, dest_owner, 'GG', 'preta', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_13, dest_owner, 'G', 'Preto', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_13, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_13, dest_owner, 'P', 'Preto', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_14, dest_owner, 'GG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_14, dest_owner, 'XG', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_14, dest_owner, 'PP', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_14, dest_owner, 'P', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_14, dest_owner, 'M', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_14, dest_owner, 'G', 'Preto', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_16, dest_owner, 'M', 'Marrocos', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_16, dest_owner, 'P', 'Marrocos', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_16, dest_owner, 'GG', 'Marrocos', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_16, dest_owner, 'G', 'Marrocos', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_18, dest_owner, 'G', 'verde Jade', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_18, dest_owner, 'M', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_18, dest_owner, 'P', 'verde Jade', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_20, dest_owner, 'M', 'Cinza Prisma', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_20, dest_owner, 'P', 'Cinza Prisma', '-', 4);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_20, dest_owner, 'G', 'Cinza Prisma', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_22, dest_owner, 'M', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_22, dest_owner, 'G', 'Cinza Chumbo', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_22, dest_owner, 'P', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_23, dest_owner, 'M', 'Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_23, dest_owner, 'G', 'Castanho', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_23, dest_owner, 'GG', 'Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_23, dest_owner, 'P', 'Castanho', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_25, dest_owner, 'M', 'Vermelho Ásia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_25, dest_owner, 'P', 'Vermelho Ásia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_25, dest_owner, 'G', 'Vermelho Ásia', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_25, dest_owner, 'M', 'Vermelho Ásia', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_25, dest_owner, 'G', 'Vermelho Ásia', '-', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_48, dest_owner, 'G', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_48, dest_owner, 'M', 'Off White', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_55, dest_owner, 'M', 'Rosé', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_55, dest_owner, 'G', 'Rosé', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_55, dest_owner, 'P', 'Rosé', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_156, dest_owner, 'G', NULL, '', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_24, dest_owner, 'M', NULL, '', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_38, dest_owner, 'P', NULL, '', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_6, dest_owner, 'M', NULL, '', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_5, dest_owner, 'M', NULL, '', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_178, dest_owner, 'P', 'Off White ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_48, dest_owner, 'P', 'Off White', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_185, dest_owner, 'P', 'Cappuccino', '-', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_4, dest_owner, 'p', NULL, '', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_57, dest_owner, 'G', 'preto glow ', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_101, dest_owner, 'P', 'Cinza Chumbo', '-', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_6, dest_owner, 'P', NULL, '', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_5, dest_owner, 'p', NULL, '', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_5, dest_owner, 'G', NULL, '', 2);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_7, dest_owner, 'M', NULL, '', 0);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_9, dest_owner, 'M', NULL, '', 1);
  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (new_prod_130, dest_owner, 'G', 'CAPPUCCINO', '-', 0);

  RAISE NOTICE 'Copia concluida! 192 produtos e 734 variantes copiados para NaBells.';
END $$;