-- Hoops City (Dubai) official courts — real OSM-sourced pins.
-- STAGED: do NOT run until go-time. This REPLACES the Sydney courts.
-- Amenities deliberately left blank (no fabrication) — Aiman vets/fills at the desk.
-- begin;
-- delete from oc_courts;  -- clears the 13 Sydney courts
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_b46f77ca','Al Nahda Pond Park','Al Nahda',25.28881,55.38175,false,false,true,false,200,'Free public park court — cross-confirmed as a real public court. First-come, first-served.','{"cost": "Free"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_b6c87dd1','Abu Hail Park','Abu Hail',25.27976,55.34555,false,false,true,false,200,'Outdoor court inside Abu Hail Park.','{"cost": "Free"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_8301b02b','Azizi Riviera Court','Nad Al Sheba',25.17151,55.29955,false,false,true,false,200,'Outdoor playground + basketball court by the Nad Al Sheba cycle track.','{"cost": "Free"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_f2b26f1b','ENOC Court — Al Quoz','Al Quoz',25.13055,55.25126,false,false,true,false,200,'Outdoor court in Al Quoz. Industrial-area court, open play.','{"cost": "Free"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_a5893e1d','AKG Court — Al Quoz 4','Al Quoz',25.14227,55.25362,false,false,true,false,200,'Outdoor court off Latifa bint Hamdan St, Al Quoz 4.','{"cost": "Free"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_b5e5b40c','The Springs 14 Court','The Springs',25.05094,55.17442,false,false,true,false,200,'Inside The Springs (Emirates Living) — residents & guests.','{"cost": "Residents & guests"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_a31a235d','La Rosa Court — Villanova','Villanova',25.07686,55.35996,false,false,true,false,200,'Villanova (Dubailand) community court.','{"cost": "Residents & guests"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_cfa981a0','Amaranta Court — Villanova','Villanova',25.07101,55.36108,false,false,true,false,200,'Villanova (Dubailand) community court.','{"cost": "Residents & guests"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_283cd3af','Mira Oasis 3 Court','Mira Oasis',25.01097,55.30039,false,false,true,false,200,'Mira Oasis (Reem) community court.','{"cost": "Residents & guests"}'::jsonb);
insert into oc_courts (key,name,suburb,lat,lon,indoor,lit,official,hidden,radius_m,notes,info) values ('oc_c_1ad722bb','Mira 3 Court','Mira',25.00686,55.30965,false,false,true,false,200,'Mira (Reem) community court.','{"cost": "Residents & guests"}'::jsonb);
-- commit;
