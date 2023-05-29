const express = require('express');
const app = express();
const db = require('../db/db');
app.set('view engine', 'ejs');

const addJob = async (req, res) => {
    if (req.method === 'GET' && !req.session.userId) {
        return res.redirect('/login'); // jika belum login, redirect ke halaman login

    } else {
        if (req.method === 'GET') {
            res.render(`addJob.ejs`);
        } else if (req.method === 'POST') {
            const { id, tittle, category, desc, salary_min, salary_max, location, exp } = req.body;
            let category_id;
            switch (category) {
                case 'Teacher':
                    category_id = 1;
                    break;
                case 'Engineer':
                    category_id = 2;
                    break;
                case 'Chef':
                    category_id = 3;
                    break;
                case 'IT':
                    category_id = 4;
                    break;
                case 'Accountant':
                    category_id = 5;
                    break;
                default:
                    category_id = 0;
                    break;
            }

            try {
                // query membuat job baru
                const is_done = false;
                await db.query(`INSERT INTO jobs VALUES (${id}, ${category_id}, ${req.session.userId}, '${tittle}', '${desc}', ${salary_min}, ${salary_max}, '${location}', ${exp}, '${is_done}')`);

                res.redirect('/home/myJobs'); // direct ke myjobs

            } catch (err) {
                console.error('Error dalam fungsi addJob: ', err);
                res.status(500).json({ error: 'Terjadi kesalahan saat menambah job' });
            }
        }
    }
}

// MELIHAT LOKER YANG DIBUAT
const myJobs = async (req, res) => {
    if (req.method === 'GET' && !req.session.userId) {
        return res.redirect('/login'); // jika belum login, redirect ke halaman login
      
        } else{
            

            if(req.method === 'GET'){
                try{
                   // ambil data jobs dan category
                    const jobs = await db.any(`
                    SELECT jobs.job_id, jobs.is_done ,jobs.tittle, jobs.desc, jobs.salary_min, jobs.salary_max, jobs.location, jobs.exp, categories.name
                    FROM categories
                    JOIN jobs ON categories.category_id = jobs.category_id
                    WHERE jobs.employer_id = ${req.session.userId};`);
                    res.render(`myJobs.ejs`, { jobs: jobs });

                }catch(err){
                    console.error('Error dalam melakukan query: ', err);
                    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data pekerjaan' });
                }
            }else if(req.method==='POST'){
                try{
                    console.log(req.body.job_id);
                    const isActiveResult = await db.any(
                    `SELECT is_done FROM jobs WHERE employer_id = ${req.session.userId} AND job_id = ${req.body.job_id};`
                    )
                    const is_active = JSON.stringify(isActiveResult[0].is_done) // casting object to string

                    console.log(is_active);
                    if(is_active == "false") { // jika masih aktif
                        // matikan
                        await db.query(`UPDATE jobs SET is_done = true WHERE job_id = ${req.body.job_id}`);
                        console.log("ini jalan 1")
                        
                    } else {// jika sudah mati 
                        await db.query(`UPDATE jobs SET is_done = false WHERE job_id = ${req.body.job_id}`);
                        console.log("ini jalan 2")
                        
                    }

                    res.redirect(`/home/myJobs`);
                }catch(err){
                    console.error('Error dalam melakukan query: ', err);
                    res.status(500).json({ error: 'Terjadi kesalahan saat mengubah data pekerjaan' });
                }
            }
        }
}

// MEMBUAT LAMARAN / KLIK APPLY
const addApp = async (req, res) => {
    if (req.method === 'POST' && !req.session.userId) {
        return res.redirect('/login'); // jika belum login, redirect ke halaman login

    } else{
        const { job_id } = req.body;
        console.log("job id: " + job_id);
        try {
            await db.query(`INSERT INTO applications(jobseeker_id, job_id, status) VALUES ($1, $2, $3)
            `, [req.session.userId, job_id, "waiting" ])

            // langsung lihat lamaran
            res.redirect('/home/myApply');

        } catch (err) {
            console.error('Error dalam fungsi addApp: ', err);
            res.status(500).json({ error: 'Terjadi kesalahan saat melamar job' });
        }
    }
}

module.exports = {
    addJob,
    addApp,
    myJobs
}
