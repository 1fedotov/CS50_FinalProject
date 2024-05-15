import json 
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from sqlalchemy import create_engine 
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import login_required, has_user, person_struct

# Configure application
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies) NEED TO REDO!!
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = '192b9bdd22ab9ed4d12e236c78afcb9a393ec15f71bbf5dc987d54727823bcbf'
Session(app)

# Connecting to SQLite database
engine = create_engine("sqlite+pysqlite:///database.db", echo=True)
db = Session(engine)


# Copied from CS50, has no clue why we need this, READ MANUAL!!
@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():


    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():

    # Forget  any user_id
    session.clear()

    # User sent POST method
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return ("must provide username", 400)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return ("must provide password", 400)
        
        # Query database for username
        rows = db.execute(
            text("SELECT * FROM users WHERE username = :username"), {"username" : request.form.get("username")}
        )
        
        user = rows.first()
        
         # Ensure username exists and password is correct
        if user is None or not check_password_hash(
            user[2], request.form.get("password")
        ):
            return ("invalid username and/or password", 400)

        # Remember which user has logged in
        session["user_id"] = user[0]

        flash("Signed in succesfully")

        # Redirect user to home page
        return redirect("/")

    else:    
        return render_template("/login.html")
    

@app.route("/logout", methods=["GET"])
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    flash("You signed out")

    # Redirect user to login form
    return redirect("/")
   

@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    # User reached route via POST
    if request.method == "POST":
        # Ensure user submitted name
        if not request.form.get("username"):
            return ("must provide username", 400)

        # Ensure user submitted password
        elif not request.form.get("password"):
            return ("must provide password", 400)

        # Ensure user submitted confirmation
        elif not request.form.get("confirmation"):
            return ("must confirm password", 400)

        # Ensure user password equals confirmation
        elif not request.form.get("confirmation") == request.form.get("password"):
            return ("password must match confirm", 400)

        username = request.form.get("username")
        password = request.form.get("password")

        # Check whether database has such username
        if not has_user(username, db):
            hash = generate_password_hash(password)
            db.execute(text("INSERT INTO users (username, hash) VALUES(:username, :hash)"), [{"username" : username, "hash" : hash}])
            db.commit()
        else:
            return ("username already taken", 400)

        flash("Registration complete!")
        return redirect("/")

    else:
        return render_template("register.html")


@app.route("/people", methods=["GET", "POST"])
@login_required
def people():
    return render_template("")


@app.route("/families", methods=["GET", "POST"])
@login_required
def families():
    return render_template("")


@app.route("/treengine", methods=["GET", "POST"])
@login_required
def treengine():
    if request.method == "GET":
        trees = db.execute(text("SELECT * FROM trees WHERE user_id = :user_id"), [{"user_id" : session["user_id"]}])
        result = trees.fetchone()

        if (result == None):
            person = person_struct.copy()
            person["children"] = []
            for i in range(2):
                child = person_struct.copy()
                child["id"] = i + 1
                person["children"].append(child)

            tree_data = person
            
            name = "template" + str(session["user_id"])
            with open('trees/' + name + '.json', 'w') as f:
                json.dump(tree_data, f)

            tree_data = json.dumps(tree_data)
            
        #else:




    return render_template("treengine.html", tree_data=tree_data)