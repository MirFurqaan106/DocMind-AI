import sys
import os

# Add backend to python path for cloud hosts
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.main import app
