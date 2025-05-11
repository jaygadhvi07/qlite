
const express = require("express");
const app = express();
const router = express.Router();

const Database = require("./db.js");

app.use(router)

router.get('/', async function(request, respone) {
    console.log("REQUEST");
})

// this is just a comment to see reflection

router.get("/create-jobs-table/", async function (request, response) {

    const Account = Database.modal('Account')
    Account.string('id')
    Account.string('user_id')
    Account.string('type')
    Account.string('provider')
    Account.string('providerAccountId')
    Account.string('refresh_token')
    Account.string('access_token')
    Account.timestamp('expires_at')
    Account.string('token_type')
    Account.string('scope')
    Account.text('id_token')
    Account.string('session_state')
    Account.unique(['provider', 'providerAccountId'])
    await Account.create()


    /*const jobs = Database.modal('jobs')
    jobs.integer('id', true, true)
    jobs.string('language')
    jobs.string('filePath')
    jobs.string('submittedAt')
    jobs.string('startedAt')
    jobs.string('completedAt')
    jobs.string('output')
    jobs.json('jsonData')
    jobs.enumm('status', ['Running', 'Pending', 'Success'])
    jobs.timestamp('created')
    jobs.timestamp('updated')
    await jobs.create()*/

    /*const user = Database.modal('users')
    user.integer('id', true, true)
    user.string('name')
    await user.create()

    const role = Database.modal('roles')
    role.integer('id', true, true)
    role.string('role')
    await role.create()

    const UserRole = Database.modal('user_role')

    UserRole.integer('user_id');
    UserRole.integer('role_id');

    UserRole.hasManyToMany({
        "users": "users_id",
        "roles": "roles_id",
        "CASCADE_DELETE": ["users_id"],
        "CASCADE_UPDATE": ["user_id", "role_id"]
    })

    await UserRole.create()*/
})

router.get("/delete-table/", async function (request, response) {

    const jobs = Database.modal('jobs')
    await jobs.drop()
})


router.get("/describe-table/", async function (request, response) {
    const job = Database.modal('jobs')
    console.log("JOBS", await job.describe())
})

// Route to post new contact in contacts database
router.post(
	"/contacts",
	async function (req, res) {
		const { name, email, phone, address } = req.body;
		try {

			const Contact = Database.modal("contacts");
			Contact.name = name;
			Contact.email = email;
			Contact.phone = phone;
			Contact.address = address;
			await Contact.save();

			res.json({ message: "Contact Inserted Successfully!" });
		} catch (err) {
			res.json({ message: err });
		}
	}
);



router.get(
	"/Contacts/:id",
	async function (req, res) {
		try {
			const Contact = Database.modal("contacts").find(req.params.id);

			res.json({
				message: "Contact Retreived Successfully!",
				data: Contact,
			});
		} catch (err) {
			res.json({ message: err });
		}
	}
);

// Route to fetch contacts from server
router.get(
	"/contacts",
	async function (req, res) {
		try {
			const rows = Database.modal("contacts").findAll();

			res.json({ rows });
		} catch (err) {
			res.json({ message: err });
		}
	}
);

router.get(
	"/truncate",
	async function (req, res) {
		try {
			const rows = Database.modal("contacts").truncate();

			res.json({ rows });
		} catch (err) {
			res.json({ message: err });
		}
	}
);

// Route to delete contact from database
router.delete(
	"/contacts/delete/:id",
	async function (req, res, next) {
		const id = req.params.id;
        try {
			const rows = Database.modal("contacts").delete(id);
			res.json({ rows });
		} catch (err) {
			res.json({ message: err });
		}
	}
);

router.put(
	"/contacts/update/:id",
	async function (req, res, next) {
		const id = req.params.id;
		var name = req.body.name;
		var email = req.body.email;
		var phone = req.body.phone;
		var address = req.body.address;
		let errors = false;

		if (
			name.length === 0 ||
			email.length === 0 ||
			phone === 0 ||
			address.length === 0
		) {
			errors = true;
			res.render("Edit", {
				title: "Please Enter all the details!",
				id: id,
				name: name,
				email: email,
				phone: phone,
				address: address,
			});
		}
		if (!errors) {
			try {
				const Contact = Database.modal("contacts").find(id);
				Contact.name = name;
				Contact.email = email;
				Contact.phone = phone;
				Contact.address = address;
				await Contact.save();

				res.json(Contact);

			} catch (err) {
				res.json({ message: err });
			}
		}
	}
);


/*router.get("/create-jobs-table/", async (request, response) => {
    try{
        const [result] = await conn.query(`CREATE TABLE IF NOT EXISTS jobs (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            language VARCHAR(255), 
            filepath VARCHAR(255), 
            inputFilePath VARCHAR(255), 
            submittedAt DATETIME, 
            startedAt DATETIME, 
            completedAt DATETIME, 
            output TEXT, 
            status ENUM("Running", "Success", "Error") DEFAULT "Running")
        `)

        response.status(201).json({success: true, result: result})

    } catch(error) {
        return response.status(500).json({success: false, error: error})
    }
})*/

var server = app.listen(3000, function () {
	console.log("App listening at PORT: 3000");
});
