import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import pickle
from config import Config

class ModelTrainer:
    def __init__(self):
        self.models = {
            'LogisticRegression': LogisticRegression(max_iter=1000),
            'DecisionTree': DecisionTreeClassifier(),
            'RandomForest': RandomForestClassifier(n_estimators=100),
            'GradientBoosting': GradientBoostingClassifier(),
            'XGBoost': xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss'),
            'IsolationForest': IsolationForest(contamination=0.01) # Unsupervised
        }
        self.results = {}
        self.best_model_name = None
        self.best_model = None

    def train_and_evaluate(self, X, y):
        """
        Part 7 & 8: Train and Evaluate Models
        """
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=Config.TEST_SIZE, random_state=Config.RANDOM_STATE)
        
        print(f"Training on {X_train.shape[0]} samples, Testing on {X_test.shape[0]} samples.")
        
        comparison_table = []
        
        for name, model in self.models.items():
            print(f"Training {name}...")
            
            if name == 'IsolationForest':
                # Unsupervised: fit on X_train (assuming majority is normal)
                model.fit(X_train)
                # Predict: -1 is outlier, 1 is inlier. Map to 1 (anomaly) and 0 (normal)
                y_pred_raw = model.predict(X_test)
                y_pred = np.where(y_pred_raw == -1, 1, 0)
                y_prob = [0.5] * len(y_test) # No probability for IF usually
            else:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                if hasattr(model, "predict_proba"):
                    y_prob = model.predict_proba(X_test)[:, 1]
                else:
                    y_prob = [0] * len(y_test)

            # Metrics
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            try:
                auc = roc_auc_score(y_test, y_prob)
            except:
                auc = 0.5
            
            metrics = {
                'Model': name,
                'Accuracy': acc,
                'Precision': prec,
                'Recall': rec,
                'F1-Score': f1,
                'ROC-AUC': auc
            }
            comparison_table.append(metrics)
            
            # Save trained model reference
            if name != 'IsolationForest': # Don't select IF as best usually if we have labels
                self.results[name] = {'model': model, 'metrics': metrics}

        # Create Comparison Table
        df_results = pd.DataFrame(comparison_table)
        print("\nModel Comparison:")
        print(df_results)
        
        # Part 8 step 3: Automatically select best model (e.g., maximize F1 or Recall)
        # Assuming we care about finding fraud (Recall is important)
        best_row = df_results[df_results['Model'] != 'IsolationForest'].sort_values(by='Recall', ascending=False).iloc[0]
        self.best_model_name = best_row['Model']
        self.best_model = self.results[self.best_model_name]['model']
        
        print(f"\nBest Model Selected: {self.best_model_name} with Recall: {best_row['Recall']:.4f}")
        
        return df_results, self.best_model

    def save_best_model(self):
        if self.best_model:
            with open(Config.MODEL_PATH, 'wb') as f:
                pickle.dump(self.best_model, f)
            print(f"Model saved to {Config.MODEL_PATH}")

    def generate_final_output(self, df_full, X_full):
        """
        Part 9: Final Output Generation
        """
        if not self.best_model:
            raise ValueError("No model trained yet.")
            
        print("Generating risk scores for full dataset...")
        # Predict on full dataset
        if hasattr(self.best_model, "predict_proba"):
            risk_scores = self.best_model.predict_proba(X_full)[:, 1]
        else:
            risk_scores = self.best_model.predict(X_full)
            
        df_full['risk_score'] = risk_scores
        
        # Export
        output_path = f"{Config.OUTPUT_DIR}/final_risk_scored_claims.csv"
        df_full.to_csv(output_path, index=False)
        print(f"Final results exported to {output_path}")
        return df_full
