import json 
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from sqlalchemy import create_engine 
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import login_required, has_user, create_tree, get_tree, update_tree, get_last_tree

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
    # User try to access the page
    if request.method == "GET":
        # Check whether current user has any tree
        trees = db.execute(text("SELECT * FROM trees WHERE user_id = :user_id"), [{"user_id" : session["user_id"]}])
        result = trees.fetchall()

        # If not then generate new tree, save .json file, then add to the table 
        if (len(result) == 0):
            tree_data = create_tree("newTree", str(session["user_id"]), db)

        # If user has tree, then send the most recent modified tree    
        else:
            # Read about result object, it's structure and how to access element by column name, not index???
            tree_data = get_last_tree(db)
            print(tree_data)
        
    
    # User send request to save a file or create new tree
    if request.method == "POST":
        tree_data = request.get_json()

        # Check whether current user has any tree
        trees = db.execute(text("SELECT * FROM trees WHERE user_id = :user_id"), [{"user_id" : session["user_id"]}])
        result = trees.fetchall()

        if (tree_data):
            update_tree(result[0][1], tree_data, db)

    return render_template("treengine.html", tree_data=tree_data)
