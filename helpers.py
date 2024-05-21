from flask import redirect, render_template, request, session
from functools import wraps
from sqlalchemy.sql import text
import json 
import datetime

name = {
    "first" : "name",
    "last" : "surname"
}

birthdate = {
    "year" : 1900,
    "month" : 1,
    "day" : 1,
}

person_struct = {
    "id" : 0,
    "name" : name,
    "birthdate" : birthdate,
    "biography" : "Biography...",
    "photo" : ""
}

def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


def has_user(username, db):
    name = db.execute(text("SELECT username FROM users WHERE username = :username"), [{"username" : username}])
    if name.all():
        return True
    return False

def create_tree(name, user_id, db):
    # Generating a structure for template
    person = person_struct.copy()
    person["children"] = []
    for i in range(2):
        child = person_struct.copy()
        child["id"] = i + 1
        person["children"].append(child)
    tree_data = person
    
    # Creating a name and path
    tree_name = name + str(user_id)
    tree_path = 'trees/' + tree_name + '.json'

    # Saving file at path trees/tree_name.json (Do we need to use .dump? What is difference between .dump and .dumps)
    # Need to solve problem of names collision (maybe have to create a folder for each user, named by user_id)
    with open(tree_path, 'w') as f:
        json.dump(tree_data, f)

    # Fill the table with tree info
    db.execute(text("INSERT INTO trees (user_id, tree_name, tree_path, last_update) VALUES(:user_id, :tree_name, :tree_path, :last_update)"), 
               [{"user_id" : user_id, "tree_name" : tree_name, "tree_path" : tree_path, "last_update" : datetime.datetime.now()}])
    db.commit()

    return json.dumps(tree_data)


def get_tree(name):
    with open('trees/' + name + '.json', 'r') as f:
        tree_data = json.load(f) # From tutorial
        return json.dumps(tree_data) # And why do we need always use .dumps? If not using then tree_data is not correct at script
    

def update_tree(name, new_data, db):
    with open('trees/' + name + '.json', 'w') as f:
        json.dump(new_data, f)
    db.execute(text("UPDATE trees SET last_update = :last_update WHERE user_id = :user_id AND tree_name = :tree_name"), 
               [{"last_update" : datetime.datetime.now(), "user_id" : session["user_id"], "tree_name" : name}])
    db.commit()

# Get last updated tree as a default tree to open once user opens trees editor
def get_last_tree(db):
    name = db.execute(text("SELECT tree_name FROM trees ORDER BY last_update DESC"))
    result = name.fetchone()
    return get_tree(str(result[0]))
