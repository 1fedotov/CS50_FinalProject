from flask import redirect, render_template, request, session
from functools import wraps
from sqlalchemy.sql import text

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
