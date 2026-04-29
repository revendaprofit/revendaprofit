const fs = require('fs');

const csvData = `name	phone	instagram	cpf	birth_date	size	total_spent	address_street	address_number	address_complement	address_neighborhood	address_city	address_state	address_zip	notes	photo_url	created_at	updated_at
Adriana Ribeiro	11944445044			1977-11-30		0										2026-03-30 14:12:37.104914+00	2026-03-30 14:12:37.104914+00
Alan Elias	11942478616	alan_.elias00		2003-11-01		274										2026-03-02 17:05:29.503803+00	2026-04-01 17:52:26.032504+00
Ale Vasquez	11963448886	ale.teacher_			p	494										2026-02-23 18:05:57.05468+00	2026-02-24 23:08:10.898062+00
Alessandra	11997419175					0										2026-03-30 17:26:09.367033+00	2026-03-30 17:26:09.367033+00
Ana Luiza Marson	11975296984	analu_marson				0										2026-03-11 02:16:26.249211+00	2026-03-11 02:17:03.939132+00
Anderson Reina	11947513951			1982-08-15	M	654										2026-02-25 14:48:04.089673+00	2026-03-30 17:27:52.413549+00
Andrea	11964388989				usa P	0										2026-02-11 16:41:59.789791+00	2026-02-11 16:41:59.789791+00
Bia Cayres	11997020505			1996-03-24	m	0										2026-03-24 17:45:12.465106+00	2026-03-24 17:45:12.465106+00
Bianca Perez Correia	11987498889			1988-02-02	p	70										2026-03-02 14:20:22.271194+00	2026-03-02 14:20:54.799123+00
Bianca Ribeiro	11999164333			2000-08-18	g	141										2026-03-31 10:25:54.928563+00	2026-03-31 10:28:07.045835+00
Bibi Junqueira	11996296207				M G	807										2026-02-13 02:41:54.003683+00	2026-03-31 09:31:27.006729+00
Camila Iha	11997159636	camilaiha		2000-03-13	P e M	0										2026-02-12 01:21:55.06717+00	2026-03-31 09:42:34.074585+00
Camila Iris	11974937068				m	274										2026-02-13 17:51:39.705238+00	2026-02-19 18:15:27.030341+00
Camila Martins	11 98631-9103			1982-01-14		116										2026-03-16 17:06:45.385652+00	2026-03-16 17:21:43.945463+00
Camilla Iha	11997159636					0										2026-03-06 23:25:41.236213+00	2026-03-31 09:42:34.074585+00
Carol Xavier	11956901306	@carol.xavier.75286		1988-08-24		176										2026-03-25 17:08:08.572662+00	2026-03-25 17:08:40.48791+00
Cássia	11 99153-7554				M	521										2026-02-14 14:00:38.542391+00	2026-03-31 09:32:39.403667+00
Cassia (amiga Gabi)	11991336715					0										2026-03-30 19:12:52.833308+00	2026-03-30 19:12:52.833308+00
Catia Marques	11991394116	catia_0512		1967-05-12	m	0										2026-03-19 20:42:53.362089+00	2026-03-19 20:42:53.362089+00
Cidinha	11992191549	cidinhaoliver			M ou G	273.05										2026-02-13 17:35:29.111379+00	2026-03-09 11:59:22.612869+00
Daiane Russani	11997982068				m g	131										2026-03-23 19:34:51.006153+00	2026-03-27 19:40:56.553531+00
Dani extreme esposa rodrigo	11017480022					466.2										2026-02-28 12:02:59.746111+00	2026-03-19 00:59:24.703043+00
Dani Padilha	11 98898-3464					0										2026-03-13 11:19:00.65895+00	2026-03-13 11:19:00.65895+00
Dani Roncoletta	11994555930	dradanironcoleta			m	391										2026-03-23 18:58:17.749984+00	2026-03-24 17:48:54.156742+00
Daniel Fonseca	11983551089					89										2026-03-02 14:17:42.847764+00	2026-03-02 14:18:06.702393+00
Daniella Regis	11974488953	daniellaregis		1992-08-01	M	0										2026-02-13 17:20:53.711032+00	2026-02-13 17:20:53.711032+00
Day	11980364511			1988-12-03		466										2026-02-25 15:07:48.011483+00	2026-03-15 02:24:18.35865+00
Deiseane Duarte	11 96655-3394	deiseanelduarte		1990-03-24	P	0										2026-03-24 21:08:41.147147+00	2026-03-24 21:09:32.104389+00
Dra Simony Morais	35 99912-7237	drasimonymorais			G	0										2026-02-13 13:37:14.268469+00	2026-02-13 13:48:37.028254+00
Edymn (Ederson Marques)	11988341145	@edymn			P	0										2026-02-11 17:04:33.756324+00	2026-02-11 17:05:31.885177+00
Erica de Oliveira	11979672195	ericaeol		1991-05-17		90										2026-02-25 15:23:23.072328+00	2026-03-09 11:54:59.199422+00
Fabi Sales	11985322788			1988-08-10	m	179										2026-02-27 17:00:23.86552+00	2026-03-17 19:35:50.386206+00
Fernanda Fragoso	11976422361				M	0										2026-02-28 02:42:28.335836+00	2026-03-27 14:21:52.855893+00
Flavia Valente	11941144103					0										2026-02-19 22:51:38.397878+00	2026-02-19 22:51:38.397878+00
Fran	11 99126-8395			1991-01-05	Usa P	0										2026-02-13 11:42:28.839642+00	2026-02-13 17:10:41.917781+00
Francine Dias	11964019622			1990-08-06		0										2026-03-19 21:20:48.491811+00	2026-03-19 21:34:41.823138+00
Gabi Aguirre	11974020553			1994-05-18	M	131										2026-03-04 16:48:11.534749+00	2026-03-04 16:49:27.750732+00
Gabi Beerblioteca	11979901867	beerbliotecaatibaia				2898										2026-03-11 01:02:04.951196+00	2026-03-17 20:21:02.264358+00
Gabi Ferrari	11 99756-7648					0										2026-04-01 17:09:48.519899+00	2026-04-01 17:09:48.519899+00
Gabi Ferrari	11 99756-7648			2026-01-03	P	177										2026-02-20 14:17:03.439757+00	2026-04-01 17:09:48.519899+00
Gabriel Prado	11970947574	corretorgabrielatibaia				364										2026-03-19 16:22:16.614187+00	2026-03-23 18:32:49.542067+00
Gabriela Santos (Seba)	11 94235-4390			1995-05-02	P	263								Gosta de macaquinho		2026-03-16 14:30:20.02814+00	2026-03-16 14:30:53.09807+00
Janaína Soares Schuck	11 96587-4788	jana_schuck	303.154.278-92	1983-03-26	G	527	Rua Antônia Bizarro	92	Apto 42	Vila Osasco	Osasco		06083160			2026-02-16 19:33:07.981879+00	2026-04-01 17:47:51.576072+00
Janis Beydoun	11996503609	janisbeydoun			M G	179										2026-03-03 22:05:45.794447+00	2026-03-08 22:46:38.270109+00
Jéssica Matos	11999368488	jematos		1991-08-13	M	0								Caio tb usa M Não gosta de nada apertando Não gosta do top carol;amanda		2026-02-13 17:37:57.042459+00	2026-02-13 17:56:48.373524+00
Jéssica Yukimi Suzuki	11999358801			1992-05-08		140.6										2026-02-24 13:26:07.683544+00	2026-02-24 13:27:52.687664+00
Juliana Castro Montechiesi	11992877196	jucastro_neta			g	151										2026-03-20 19:09:16.512086+00	2026-03-20 19:10:03.670476+00
Juscimara	35998187014				g1	560										2026-02-18 14:21:00.845649+00	2026-03-02 12:44:17.958456+00
Jussane Medina	51993041125	jussanemedina		1978-02-21	top m shorts gg	1113.05										2026-02-13 17:12:35.77595+00	2026-03-27 13:50:47.659162+00
Kiki				1995-03-23		0										2026-03-24 09:30:04.786268+00	2026-03-24 09:30:04.786268+00
Kiki Iha	11 99588-4175	@walkiria_iha		1992-03-22	M	0								Ama rosa		2026-03-24 16:57:15.012578+00	2026-03-24 16:57:15.012578+00
Leticia Fianeze	11915693585	leticia.fianeze			Top G shorts M	0								Gosta do empina bumbum e camiseta over		2026-02-11 03:15:22.760046+00	2026-02-11 03:15:22.760046+00
Lidiane	11971891456			1988-02-22	M	0										2026-02-18 22:50:14.960396+00	2026-02-19 22:52:12.748575+00
Lidy	11 99783-0275					178										2026-03-14 15:07:21.934747+00	2026-03-16 16:47:30.454177+00
Lu Barbosa	11912845854	@lubarbosah				0										2026-03-20 19:02:26.837739+00	2026-03-23 18:31:51.605232+00
Luana	11973969036					375.25										2026-03-04 12:25:20.374256+00	2026-03-04 12:25:20.374256+00
Luana	11973969036					375.25										2026-03-02 17:54:46.62923+00	2026-03-04 12:25:20.374256+00
Luciana Escudeiro (amiga Dai Russani)	11974835978				g gg	94										2026-03-23 19:34:15.855747+00	2026-04-01 17:50:31.026549+00
Lud	17 99765-2933			1985-12-22	P	0										2026-02-28 22:32:32.393249+00	2026-03-02 12:41:07.865667+00
Luma Beatriz	11941711996		408.409.988-05	1991-12-09	G	0	RUA PROF JOSÃ MARIA CALAZANS NOGUEIRA	232	Apto 303 A	PQ SÃO DOMINGOS	SÃ£o Paulo		05122010			2026-02-24 13:47:04.15397+00	2026-02-24 13:47:04.15397+00
Marcelle Silvano	11996318595	marcelle.silvano		1982-09-19		735										2026-03-27 13:12:21.539128+00	2026-04-01 17:10:49.585574+00
Márcia Cross Crew	11941189232			1985-03-25		434										2026-03-02 12:59:19.906003+00	2026-04-01 17:36:16.517998+00
Maria Carmo Revenda Ponta Grossa	42984130365					0										2026-02-13 18:20:38.336731+00	2026-02-13 18:20:38.336731+00
Marina Maitina	11 96057-3253			1987-03-23	P	0										2026-03-05 14:36:39.614195+00	2026-03-05 14:36:39.614195+00
Mayara Bueno Duete	11972829205			1994-07-16	g	1032										2026-02-27 17:05:50.652885+00	2026-04-01 17:12:05.276539+00
Michele Silva (Mi)	35997459855	@mi_silvamg		0988-09-13	M	0								Gosta do cropped Carol		2026-02-12 01:10:09.463193+00	2026-02-12 01:10:09.463193+00
Michelle Cris	11939292886					1717										2026-03-31 10:27:22.033137+00	2026-04-01 17:19:15.295764+00
Michelle Cris	11939292886				Top M shorts P	5896										2026-03-02 14:22:05.864793+00	2026-04-01 17:19:15.295764+00
Pamela Oporto	11975130187					0										2026-03-09 19:31:01.103595+00	2026-03-09 19:31:01.103595+00
Patrikson	11956101555					0										2026-03-30 18:00:37.84627+00	2026-03-30 18:00:37.84627+00
Pri Carotta	11988383783	priscilacarotta			P	535										2026-02-18 14:39:06.32467+00	2026-03-14 01:04:38.980477+00
Rachel Generosa						0										2026-02-28 02:45:08.484797+00	2026-02-28 02:45:08.484797+00
Regina Gomes	11 98483-2585			1989-03-03	Top P shorts M	141										2026-03-19 19:03:16.650058+00	2026-03-19 19:06:21.108246+00
Renata Reis	11 99945-5389	@renatareisadv		1982-03-24	M	0										2026-03-24 16:55:38.400398+00	2026-03-24 16:55:38.400398+00
Renata Sales Meyer	11979588587			1980-12-13	p	0										2026-02-12 18:46:00.32082+00	2026-02-12 18:46:00.32082+00
Romulo esposo Tati Campos	11 91700-0101					141										2026-03-09 11:52:40.21901+00	2026-03-09 11:54:19.321127+00
Rosangela	11999410195				Top G, shorts M. Prefere mais cumprido	580										2026-02-11 03:17:12.690703+00	2026-02-19 17:14:18.643444+00
Samanta Albertini	11 99710-8208				M	99										2026-02-22 17:04:02.700799+00	2026-02-22 17:06:17.487081+00
Sara Portuense	11974233455			1960-06-05		0										2026-03-16 13:47:18.553483+00	2026-03-16 13:47:18.553483+00
Talita Merloti	11953096140	talitamerloti				0										2026-02-12 18:39:40.229763+00	2026-02-12 18:39:40.229763+00
Tarsila Bondança	11998539333					0								Esposa Marquinhos Coach		2026-03-31 10:11:10.41301+00	2026-03-31 10:11:10.41301+00
Tati Campos	11 95999-1346			1986-03-25	M	407.0										2026-03-07 14:42:57.546693+00	2026-03-17 19:31:01.255544+00
Taty Sacramento	11988036088	tatysalvasacramento			m	444										2026-02-19 09:46:22.976381+00	2026-02-21 17:45:45.939716+00
Thainá Gonçalves	11992884238	thainagoncalvess		1995-10-12		99										2026-03-16 14:24:06.692949+00	2026-03-16 14:25:58.366754+00
Thais Biazini	11 97310-3749	mais.um.dia.do.processo		1980-02-22		0										2026-02-22 17:43:27.172807+00	2026-02-22 17:43:27.172807+00
Thais Chong	11930907059	_thaischong			G	868.15										2026-02-13 18:10:17.258484+00	2026-03-31 09:36:01.828676+00
Thatiane Bertolacini	35 99888-8482				M	220										2026-03-19 18:51:31.218904+00	2026-03-19 18:53:30.01219+00
Valéria Araújo	11 99803-0042	@valeria_araujo.silva			M	189										2026-02-14 13:59:45.69884+00	2026-03-02 12:52:26.745259+00
Vanessa Morais	11930114937					485										2026-03-24 14:30:26.407126+00	2026-03-26 21:24:12.092862+00
Yasmin	11974018332				`;

const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const headers = lines[0].split('\t');

let sql = `
DO $$
DECLARE
  v_owner uuid;
  v_customer_id uuid;
BEGIN
  -- Get Dayana's ID
  SELECT id INTO v_owner FROM public.profiles WHERE LOWER(email) = LOWER('dayana_tbperez@hotmail.com');
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Usuária Dayana não encontrada.';
  END IF;

`;

// name	phone	instagram	cpf	birth_date	size	total_spent	address_street	address_number	address_complement	address_neighborhood	address_city	address_state	address_zip	notes	photo_url	created_at	updated_at
for(let i=1; i<lines.length; i++) {
  const cols = lines[i].split('\t');
  let name = cols[0] ? cols[0].replace(/'/g, "''") : '';
  let phone = cols[1] ? cols[1].replace(/'/g, "''") : '';
  let instagram = cols[2] ? cols[2].replace(/'/g, "''") : '';
  let document = cols[3] ? cols[3].replace(/'/g, "''") : '';
  let birth_date = cols[4] ? cols[4].trim() : '';
  let size = cols[5] ? cols[5].replace(/'/g, "''") : '';
  let total_spent = cols[6] ? parseFloat(cols[6]) : 0;
  
  let addrStr = [];
  if (cols[7]) addrStr.push(cols[7]); // street
  if (cols[8]) addrStr.push(cols[8]); // number
  if (cols[9]) addrStr.push(cols[9]); // complement
  if (cols[10]) addrStr.push(cols[10]); // neighborhood
  if (cols[11]) addrStr.push(cols[11]); // city
  if (cols[12]) addrStr.push(cols[12]); // state
  let address = addrStr.join(', ').replace(/'/g, "''");
  
  let notes = cols[14] ? cols[14].replace(/'/g, "''") : '';
  
  // Format birth_date properly if valid
  let bdateStr = 'NULL';
  if (birth_date.length === 10 && birth_date.includes('-')) {
     bdateStr = \`'\${birth_date}'::date\`;
  }
  
  // Create customer
  sql += \`
  INSERT INTO public.customers (owner_id, name, phone, instagram, document, address, birth_date, size_top, training_location)
  VALUES (v_owner, '\${name}', '\${phone}', '\${instagram}', '\${document}', '\${address}', \${bdateStr}, '\${size}', '\${notes}')
  RETURNING id INTO v_customer_id;
\`;

  // Create dummy sale for total_spent if > 0
  if (!isNaN(total_spent) && total_spent > 0) {
    sql += \`
  INSERT INTO public.sales (owner_id, customer_id, total_amount, payment_method, status, observations)
  VALUES (v_owner, v_customer_id, \${total_spent}, 'legacy_import', 'completed', 'Importação de Histórico: R$ \${total_spent}');
\`;
  }
}

sql += \`
END $$;
\`;

fs.writeFileSync('c:\\\\Users\\\\Team WOD Brasil\\\\Desktop\\\\Revenda Profit\\\\supabase\\\\migrations\\\\20260425_phase50_import_dayana.sql', sql);
console.log('SQL Generated!');
