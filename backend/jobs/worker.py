# app/jobs/worker.py
from arq.connections import RedisSettings
from jobs.settings import REDIS_SETTINGS
from jobs.submission_tools import evaluate_submission


class WorkerSettings:
    functions = [evaluate_submission]
    redis_settings = REDIS_SETTINGS
    max_jobs = 6
    job_timeout = 30
    max_tries = 3

class MatchWorkerSettings:
    functions = [evaluate_submission]
    queue_name = "match_submissions"
    redis_settings = REDIS_SETTINGS
    max_jobs = 4
    job_timeout = 30
    max_tries = 3

class PracticeWorkerSettings:
    functions = [evaluate_submission]
    queue_name = "practice_submissions"
    redis_settings = REDIS_SETTINGS
    max_jobs = 2
    job_timeout = 30
    max_tries = 3