# Preserve line numbers in stack traces for crash reporting.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor core is protected by its own bundled consumer rules.
# Keep plugin classes referenced by annotation in case any are missed.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
