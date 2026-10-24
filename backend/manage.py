"""Account maintenance from the server shell.

    docker compose exec api python manage.py create-user <username>
    docker compose exec api python manage.py set-password <username>
    docker compose exec api python manage.py sign-out-everywhere
"""
import argparse
import getpass
import sys

from database.connection import SessionLocal, init_db
from models.db_models import AuthSession, User
from security import MIN_PASSWORD_LENGTH, create_user, hash_password


def _prompt_password() -> str:
    while True:
        first = getpass.getpass("New password: ")
        if len(first) < MIN_PASSWORD_LENGTH:
            print(f"Use at least {MIN_PASSWORD_LENGTH} characters.")
            continue
        if getpass.getpass("Repeat password: ") != first:
            print("Those didn't match. Try again.")
            continue
        return first


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    create = sub.add_parser("create-user", help="Create the dashboard account")
    create.add_argument("username")
    create.add_argument("--display-name", default="")
    reset = sub.add_parser("set-password", help="Reset a password and sign out all sessions")
    reset.add_argument("username")
    sub.add_parser("sign-out-everywhere", help="End every active session")
    args = parser.parse_args(argv)

    init_db()
    db = SessionLocal()
    try:
        if args.command == "create-user":
            if db.query(User).filter(User.username == args.username.lower()).first():
                print("That user already exists. Use set-password instead.")
                return 1
            create_user(db, args.username, _prompt_password(), args.display_name)
            print(f"Created {args.username.lower()}.")
        elif args.command == "set-password":
            user = db.query(User).filter(User.username == args.username.lower()).first()
            if not user:
                print("No such user.")
                return 1
            user.password_hash = hash_password(_prompt_password())
            db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
            db.commit()
            print("Password updated; every session was signed out.")
        elif args.command == "sign-out-everywhere":
            count = db.query(AuthSession).delete()
            db.commit()
            print(f"Ended {count} session(s).")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
