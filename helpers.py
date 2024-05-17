from flask import redirect, render_template, request, session
from functools import wraps
from sqlalchemy.sql import text
import json 


person_struct = {
    "id" : 0,
    "name" : "person"
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
    db.execute(text("INSERT INTO trees (user_id, tree_name, tree_path) VALUES(:user_id, :tree_name, :tree_path)"), 
               [{"user_id" : user_id, "tree_name" : tree_name, "tree_path" : tree_path}])
    db.commit()

    return json.dumps(tree_data)


def get_tree(name):
    with open('trees/' + name + '.json', 'r') as f:
        tree_data = json.load(f) # From tutorial
        return json.dumps(tree_data) # And why do we need always use .dumps? If not using then tree_data is not correct at script
    

def update_tree(name, new_data):
    with open('trees/' + name + '.json', 'w') as f:
        json.dump(new_data, f)