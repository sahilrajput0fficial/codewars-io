# app/jobs/worker.py
from arq.connections import RedisSettings
from arq import cron
from jobs.settings import REDIS_SETTINGS
from jobs.submission_tools import evaluate_submission
from jobs.match_tools import complete_exisiting_matches

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


class CompleteExisitingMatch:
    functions = [complete_exisiting_matches]
    redis_settings = REDIS_SETTINGS
    max_jobs = 2
    job_timeout = 30
    max_tries = 2
    cron_jobs = [
        cron(
            complete_exisiting_matches, 
            second={0, 30},  # Runs every 30 seconds
        )
    ]
